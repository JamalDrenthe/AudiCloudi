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

export async function saveLocalAudioFile(trackId: string, file: Blob): Promise<string> {
  // 1. Immediately cache in memory synchronously for instant playback
  const mimeType = file.type || 'audio/mpeg';
  memoryBlobCache.set(trackId, file);
  const existingUrl = memoryAudioUrlCache.get(trackId);
  if (existingUrl) {
    URL.revokeObjectURL(existingUrl);
  }
  const freshUrl = URL.createObjectURL(file);
  memoryAudioUrlCache.set(trackId, freshUrl);

  try {
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
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(payload, trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => {
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

  return freshUrl;
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

// In-memory cache for cover videos
const memoryVideoUrlCache = new Map<string, string>();

export function getVideoUrlSync(id: string): string | null {
  return memoryVideoUrlCache.get(id) || null;
}

export async function saveLocalVideoFile(id: string, file: Blob): Promise<string> {
  const videoKey = `video_${id}`;
  const mimeType = file.type || 'video/mp4';
  const existingUrl = memoryVideoUrlCache.get(id);
  if (existingUrl) {
    URL.revokeObjectURL(existingUrl);
  }
  const freshUrl = URL.createObjectURL(file);
  memoryVideoUrlCache.set(id, freshUrl);

  try {
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
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(payload, videoKey);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to store video in IndexedDB:', err);
  }

  return freshUrl;
}

export async function getLocalVideoUrl(id: string): Promise<string | null> {
  const cached = memoryVideoUrlCache.get(id);
  if (cached) return cached;

  const videoKey = `video_${id}`;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(videoKey);

      req.onsuccess = () => {
        const result = req.result;
        if (!result) {
          resolve(null);
          return;
        }

        let blob: Blob | null = null;
        if (result && typeof result === 'object' && 'buffer' in result) {
          blob = new Blob([result.buffer], { type: result.type || 'video/mp4' });
        } else if (result instanceof Blob) {
          blob = result;
        }

        if (blob) {
          const url = URL.createObjectURL(blob);
          memoryVideoUrlCache.set(id, url);
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

// In-memory cache for cover images
const memoryCoverImageUrlCache = new Map<string, string>();

export function getCoverImageUrlSync(id: string): string | null {
  return memoryCoverImageUrlCache.get(id) || null;
}

export async function saveLocalCoverImage(id: string, imageSrc: string): Promise<string> {
  const imageKey = `cover_${id}`;
  memoryCoverImageUrlCache.set(id, imageSrc);

  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(imageSrc, imageKey);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to store cover image in IndexedDB:', err);
  }

  return imageSrc;
}

export async function getLocalCoverImageUrl(id: string): Promise<string | null> {
  const cached = memoryCoverImageUrlCache.get(id);
  if (cached) return cached;

  const imageKey = `cover_${id}`;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(imageKey);

      req.onsuccess = () => {
        const result = req.result;
        if (result && typeof result === 'string') {
          memoryCoverImageUrlCache.set(id, result);
          resolve(result);
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

  const videoUrl = memoryVideoUrlCache.get(trackId);
  if (videoUrl) {
    URL.revokeObjectURL(videoUrl);
  }
  memoryVideoUrlCache.delete(trackId);
  memoryCoverImageUrlCache.delete(trackId);

  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(trackId);
      store.delete(`video_${trackId}`);
      store.delete(`cover_${trackId}`);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore
  }
}

