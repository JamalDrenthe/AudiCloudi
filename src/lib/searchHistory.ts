import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'audicloudi_recent_searches';
const MAX_SEARCHES = 12;

export function getLocalRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string' && item.trim().length > 0);
      }
    }
  } catch {
    // Ignore error
  }
  return ['Electronic', 'Synthwave', 'Jamal Drenthe', 'Lo-Fi Chill'];
}

export function saveLocalRecentSearches(searches: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches.slice(0, MAX_SEARCHES)));
  } catch {
    // Ignore error
  }
}

export async function addRecentSearch(query: string, userId?: string | null): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return getLocalRecentSearches();

  const current = getLocalRecentSearches();
  // Filter out duplicates (case insensitive) and put new query at the front
  const updated = [
    trimmed,
    ...current.filter(item => item.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX_SEARCHES);

  saveLocalRecentSearches(updated);

  // Sync to Firestore if user is logged in
  if (userId) {
    try {
      const historyRef = doc(db, 'users', userId);
      // We don't block on this
      setDoc(historyRef, { recentSearches: updated }, { merge: true }).catch(() => {});
    } catch {
      // Ignore
    }
  }

  return updated;
}

export async function removeRecentSearch(queryToRemove: string, userId?: string | null): Promise<string[]> {
  const current = getLocalRecentSearches();
  const updated = current.filter(item => item.toLowerCase() !== queryToRemove.toLowerCase());
  saveLocalRecentSearches(updated);

  if (userId) {
    try {
      const historyRef = doc(db, 'users', userId);
      setDoc(historyRef, { recentSearches: updated }, { merge: true }).catch(() => {});
    } catch {
      // Ignore
    }
  }

  return updated;
}

export async function clearRecentSearches(userId?: string | null): Promise<void> {
  saveLocalRecentSearches([]);
  if (userId) {
    try {
      const historyRef = doc(db, 'users', userId);
      setDoc(historyRef, { recentSearches: [] }, { merge: true }).catch(() => {});
    } catch {
      // Ignore
    }
  }
}

export async function loadRecentSearchesWithFirestore(userId?: string | null): Promise<string[]> {
  const localList = getLocalRecentSearches();
  if (!userId) return localList;

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (Array.isArray(data?.recentSearches) && data.recentSearches.length > 0) {
        // Merge with local list
        const merged = [
          ...data.recentSearches,
          ...localList.filter(item => !data.recentSearches.some((s: string) => s.toLowerCase() === item.toLowerCase())),
        ].slice(0, MAX_SEARCHES);
        saveLocalRecentSearches(merged);
        return merged;
      }
    }
  } catch {
    // Return local list
  }
  return localList;
}
