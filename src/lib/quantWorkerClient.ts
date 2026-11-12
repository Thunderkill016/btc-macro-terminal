import {
  QuantWorkerRequest,
  QuantWorkerResponse,
  executeQuantWorkerTaskSync,
} from '../workers/quantWorker';

let workerInstance: Worker | null = null;
const pendingCallbacks = new Map<
  string,
  { resolve: (val: any) => void; reject: (err: any) => void }
>();

function getOrCreateQuantWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }
  if (workerInstance) return workerInstance;

  try {
    workerInstance = new Worker(
      new URL('../workers/quantWorker.ts', import.meta.url),
      { type: 'module' }
    );
    workerInstance.onmessage = (event: MessageEvent<QuantWorkerResponse>) => {
      const res = event.data;
      if (!res || !res.id) return;
      const entry = pendingCallbacks.get(res.id);
      if (entry) {
        pendingCallbacks.delete(res.id);
        if (res.success) {
          entry.resolve(res.result);
        } else {
          entry.reject(new Error(res.error || 'Quant worker failed'));
        }
      }
    };
    workerInstance.onerror = () => {
      // Fallback to sync if worker script loading fails
      workerInstance = null;
    };
    return workerInstance;
  } catch {
    return null;
  }
}

export async function runQuantWorkerTask<T = any>(
  req: Omit<QuantWorkerRequest, 'id'>
): Promise<T> {
  const id = `qw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const fullReq = { ...req, id } as QuantWorkerRequest;
  const worker = getOrCreateQuantWorker();

  if (!worker) {
    return Promise.resolve(executeQuantWorkerTaskSync(fullReq));
  }

  return new Promise<T>((resolve) => {
    const timeoutId = setTimeout(() => {
      if (pendingCallbacks.has(id)) {
        pendingCallbacks.delete(id);
        resolve(executeQuantWorkerTaskSync(fullReq));
      }
    }, 2500);

    pendingCallbacks.set(id, {
      resolve: (val) => {
        clearTimeout(timeoutId);
        resolve(val);
      },
      reject: () => {
        clearTimeout(timeoutId);
        resolve(executeQuantWorkerTaskSync(fullReq));
      },
    });

    try {
      worker.postMessage(fullReq);
    } catch {
      clearTimeout(timeoutId);
      pendingCallbacks.delete(id);
      resolve(executeQuantWorkerTaskSync(fullReq));
    }
  });
}
