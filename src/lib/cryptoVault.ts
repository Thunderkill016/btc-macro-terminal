// ==============================================================================
// ZERO-KNOWLEDGE WEBCRYPTO AES-256-GCM PASSPHRASE VAULT
// OWASP 2026 Compliant: PBKDF2 (600,000 iterations, HMAC-SHA256, 32-byte salt)
// Minimum Passphrase Length: 8+ characters (Strict anti-brute-force defense)
// Authenticated Encryption with Associated Data (AEAD) via AES-GCM 256-bit
// ==============================================================================

export interface EncryptedVaultPayload {
  version: 'v6_passphrase';
  ciphertext: string; // Base64
  iv: string;         // Base64 (12 bytes for AES-GCM)
  salt: string;       // Base64 (32 bytes for PBKDF2)
  iterations: number; // 600,000 iterations
  apiKey: string;     // Plaintext public API Key
  createdAt: number;
}

const VAULT_STORAGE_KEY_V6 = 'btc_terminal_vault_gcm_v6';
const LEGACY_STORAGE_KEY_V5 = 'btc_terminal_vault_gcm_v5';
const MIN_PASSPHRASE_LENGTH = 8;
const OWASP_PBKDF2_ITERATIONS = 600000;

// Base64 helpers
function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Validates passphrase security requirements.
 * Strictly forbids 4-digit numeric PINs and passphrases shorter than 8 characters.
 */
export function validatePassphraseStrength(passphrase: string): { valid: boolean; errorVi?: string; errorEn?: string } {
  const trimmed = passphrase.trim();
  if (/^\d{4}$/.test(trimmed)) {
    return {
      valid: false,
      errorVi: 'Mã PIN 4 số đã bị loại bỏ vì lý do bảo mật (không đủ entropy). Vui lòng sử dụng Passphrase tự do tối thiểu 8 ký tự.',
      errorEn: '4-digit PINs have been deprecated due to low entropy. Please use a passphrase of at least 8 characters.',
    };
  }
  if (trimmed.length < MIN_PASSPHRASE_LENGTH) {
    return {
      valid: false,
      errorVi: `Passphrase bảo mật phải có độ dài tối thiểu ${MIN_PASSPHRASE_LENGTH} ký tự để bảo vệ chống vét cạn GPU (OWASP standard).`,
      errorEn: `Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters to defend against GPU brute-force (OWASP standard).`,
    };
  }
  return { valid: true };
}

/**
 * Derives a 256-bit AES-GCM key from user passphrase using PBKDF2 with 600,000 iterations.
 */
async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = OWASP_PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKeyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations,
      hash: 'SHA-256',
    },
    baseKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts API Secret with user passphrase (min 8 chars, 600,000 iterations)
 * and persists safely to client localStorage.
 */
export async function saveEncryptedBinanceVault(
  apiKey: string,
  apiSecret: string,
  passphrase: string
): Promise<void> {
  if (!apiSecret || !passphrase) return;

  const validation = validatePassphraseStrength(passphrase);
  if (!validation.valid) {
    throw new Error(validation.errorVi);
  }

  // 32-byte salt (256 bits) for robust entropy
  const salt = crypto.getRandomValues(new Uint8Array(32));
  // 12-byte IV (96 bits) for standard AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassphrase(passphrase, salt, OWASP_PBKDF2_ITERATIONS);

  const encoder = new TextEncoder();
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(apiSecret)
  );

  const payload: EncryptedVaultPayload = {
    version: 'v6_passphrase',
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
    iterations: OWASP_PBKDF2_ITERATIONS,
    apiKey,
    createdAt: Date.now(),
  };

  localStorage.setItem(VAULT_STORAGE_KEY_V6, JSON.stringify(payload));
  // Remove legacy key if upgrading
  localStorage.removeItem(LEGACY_STORAGE_KEY_V5);
}

/**
 * Checks if an encrypted vault exists in localStorage.
 */
export function getEncryptedBinanceVaultMeta(): {
  hasVault: boolean;
  apiKey: string;
  createdAt: number | null;
  version: 'v6_passphrase' | 'legacy_v5' | null;
} {
  try {
    const rawV6 = localStorage.getItem(VAULT_STORAGE_KEY_V6);
    if (rawV6) {
      const parsed = JSON.parse(rawV6) as EncryptedVaultPayload;
      if (parsed && parsed.ciphertext && parsed.iv && parsed.salt) {
        return {
          hasVault: true,
          apiKey: parsed.apiKey || '',
          createdAt: parsed.createdAt || null,
          version: 'v6_passphrase',
        };
      }
    }

    const rawV5 = localStorage.getItem(LEGACY_STORAGE_KEY_V5);
    if (rawV5) {
      const parsed = JSON.parse(rawV5);
      if (parsed && parsed.ciphertext && parsed.iv && parsed.salt) {
        return {
          hasVault: true,
          apiKey: parsed.apiKey || '',
          createdAt: parsed.createdAt || null,
          version: 'legacy_v5',
        };
      }
    }
  } catch {}
  return { hasVault: false, apiKey: '', createdAt: null, version: null };
}

/**
 * Decrypts API Secret using user passphrase into temporary in-memory RAM.
 */
export async function unlockBinanceVault(
  passphrase: string
): Promise<{ apiKey: string; apiSecret: string }> {
  const rawV6 = localStorage.getItem(VAULT_STORAGE_KEY_V6);
  if (rawV6) {
    const payload: EncryptedVaultPayload = JSON.parse(rawV6);
    const salt = new Uint8Array(base64ToBuffer(payload.salt));
    const iv = new Uint8Array(base64ToBuffer(payload.iv));
    const ciphertext = base64ToBuffer(payload.ciphertext);
    const iterations = payload.iterations || OWASP_PBKDF2_ITERATIONS;

    const key = await deriveKeyFromPassphrase(passphrase, salt, iterations);

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any },
        key,
        ciphertext
      );
      const decoder = new TextDecoder();
      const apiSecret = decoder.decode(decryptedBuffer);
      return {
        apiKey: payload.apiKey,
        apiSecret,
      };
    } catch {
      throw new Error('Passphrase không chính xác hoặc dữ liệu bị xáo trộn (AES-GCM Auth Failed)');
    }
  }

  // Fallback for legacy v5 vaults
  const rawV5 = localStorage.getItem(LEGACY_STORAGE_KEY_V5);
  if (rawV5) {
    const payload = JSON.parse(rawV5);
    const salt = new Uint8Array(base64ToBuffer(payload.salt));
    const iv = new Uint8Array(base64ToBuffer(payload.iv));
    const ciphertext = base64ToBuffer(payload.ciphertext);

    const key = await deriveKeyFromPassphrase(passphrase, salt, 250000);

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any },
        key,
        ciphertext
      );
      const decoder = new TextDecoder();
      const apiSecret = decoder.decode(decryptedBuffer);
      return {
        apiKey: payload.apiKey,
        apiSecret,
      };
    } catch {
      throw new Error('Passphrase/PIN cũ không chính xác hoặc dữ liệu bị xáo trộn');
    }
  }

  throw new Error('Không tìm thấy ví mã hóa trong trình duyệt');
}

/**
 * Deletes encrypted vault from localStorage.
 */
export function deleteBinanceVault(): void {
  localStorage.removeItem(VAULT_STORAGE_KEY_V6);
  localStorage.removeItem(LEGACY_STORAGE_KEY_V5);
}

/**
 * Signs query string using WebCrypto HMAC-SHA256 entirely inside client browser RAM.
 * Ensures apiSecret NEVER leaves the user's browser over the network!
 */
export async function signQueryHmacSha256(queryString: string, apiSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(queryString));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
