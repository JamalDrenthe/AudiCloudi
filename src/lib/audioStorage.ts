const DB_NAME = 'audicloudi_audio_db';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

// In-memory cache for synchronous, zero-latency access during click events
const memoryAudioUrlCache = new Map<string, string>();
const memoryBlobCache = new Map<string, Blob>();

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Synchronously returns a pre-cached object URL if available in memory.
 * This enables instant playback within the synchronous user click handler.
 */
export function getAudioUrlSync(trackId: string): string | null {
  return memoryAudioUrlCache.get(trackId) || null;
}

/**
 * Initializes and warms the in-memory cache from IndexedDB on startup.
 */
export async function initAudioStorage(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const trackId = String(cursor.key);
        const val = cursor.value;

        if (!memoryAudioUrlCache.has(trackId)) {
          if (val && typeof val === 'object' && 'buffer' in val) {
            const blob = new Blob([val.buffer], { type: val.type || 'audio/mpeg' });
            memoryBlobCache.set(trackId, blob);
            memoryAudioUrlCache.set(trackId, URL.createObjectURL(blob));
          } else if (val instanceof Blob) {
            memoryBlobCache.set(trackId, val);
            memoryAudioUrlCache.set(trackId, URL.createObjectURL(val));
          }
        }
        cursor.continue();
      }
    };
  } catch (err) {
    console.warn('Audio storage initialization warning:', err);
  }
}

// Auto-run cache warm-up in browser
if (typeof window !== 'undefined') {
  initAudioStorage().catch(() => {});
}

export async function saveLocalAudioFile(trackId: string, file: Blob): Promise<void> {
  try {
    // 1. Immediately cache in memory synchronously for instant playback
    const mimeType = file.type || 'audio/mpeg';
    memoryBlobCache.set(trackId, file);
    const existingUrl = memoryAudioUrlCache.get(trackId);
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl);
    }
    const freshUrl = URL.createObjectURL(file);
    memoryAudioUrlCache.set(trackId, freshUrl);

    // 2. Read arrayBuffer for universal IndexedDB compatibility across all browsers/iframes
    let buffer: ArrayBuffer | null = null;
    try {
      buffer = await file.arrayBuffer();
    } catch {
      buffer = null;
    }

    const payload = buffer
      ? { buffer, type: mimeType, updatedAt: Date.now() }
      : file;

    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(payload, trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => {
        // Fallback: try saving raw blob if structured clone of object failed
        try {
          const fallbackTx = db.transaction(STORE_NAME, 'readwrite');
          fallbackTx.objectStore(STORE_NAME).put(file, trackId);
        } catch {
          // Ignore
        }
        resolve();
      };
    });
  } catch (err) {
    console.warn('Failed to store audio in IndexedDB:', err);
  }
}

export async function getLocalAudioUrl(trackId: string): Promise<string | null> {
  // Check memory cache first
  const cached = memoryAudioUrlCache.get(trackId);
  if (cached) return cached;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);

      req.onsuccess = () => {
        const result = req.result;
        if (!result) {
          resolve(null);
          return;
        }

        let blob: Blob | null = null;
        if (result && typeof result === 'object' && 'buffer' in result) {
          blob = new Blob([result.buffer], { type: result.type || 'audio/mpeg' });
        } else if (result instanceof Blob) {
          blob = result;
        }

        if (blob) {
          memoryBlobCache.set(trackId, blob);
          const url = URL.createObjectURL(blob);
          memoryAudioUrlCache.set(trackId, url);
          resolve(url);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteLocalAudioFile(trackId: string): Promise<void> {
  const cachedUrl = memoryAudioUrlCache.get(trackId);
  if (cachedUrl) {
    URL.revokeObjectURL(cachedUrl);
  }
  memoryAudioUrlCache.delete(trackId);
  memoryBlobCache.delete(trackId);

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Ignore
  }
}

