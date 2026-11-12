/**
 * ==============================================================================
 * BITCOIN ALPHA TERMINAL — INFRASTRUCTURE LAYER
 * Clean Architecture (Robert C. Martin) & Quantitative Desk Standard
 *
 * Rules:
 * 1. Isolates all external I/O (WebSockets, REST APIs, WebCrypto Hardware Storage).
 * 2. Enforces runtime schema validation and fallback timestamps (lastUpdated, isStale).
 * 3. Never couples to presentation components or business logic directly.
 * ==============================================================================
 */

export * from './websocket/binanceWebSocket';
export * from './orderbook/binanceOrderbook';
export * from './api/derivativesRest';
export * from './api/realDataService';
export * from './security/webCryptoVault';
