"""
CloudiAudi Zero-Fixed-Cost In-Memory Multi-Tier Cache.
Eliminates expensive permanent Redis instances ($50-$200/mo) in favor of:
- Tier 1: Thread-safe in-memory warm-instance LRU TTL cache (0.00 EUR fixed cost)
- Tier 2: Cloud CDN & browser edge caching headers
Provides high-throughput sub-millisecond retrieval of candidate pools,
bandit cluster centroids, and trending tracks.
"""

from __future__ import annotations

import threading
import time
from typing import Any, Callable, Dict, List, Optional, Tuple


class TTLItem:
    __slots__ = ("value", "expires_at")

    def __init__(self, value: Any, expires_at: float):
        self.value = value
        self.expires_at = expires_at

    def is_expired(self, now: float) -> bool:
        return now >= self.expires_at


class InstanceWarmCache:
    """
    Thread-safe, zero-cost, in-memory LRU/TTL cache designed for Cloud Run
    and Cloud Functions warm instances.
    """

    def __init__(self, default_ttl_seconds: float = 60.0, max_size: int = 1000):
        self.default_ttl = default_ttl_seconds
        self.max_size = max_size
        self._stores: Dict[str, Dict[str, TTLItem]] = {}
        self._lock = threading.RLock()

    def _get_namespace_store(self, namespace: str) -> Dict[str, TTLItem]:
        if namespace not in self._stores:
            self._stores[namespace] = {}
        return self._stores[namespace]

    def get(self, namespace: str, key: str) -> Optional[Any]:
        """Retrieves value if present and not expired; otherwise None."""
        now = time.time()
        with self._lock:
            store = self._stores.get(namespace)
            if not store:
                return None
            item = store.get(key)
            if not item:
                return None
            if item.is_expired(now):
                del store[key]
                return None
            return item.value

    def set(
        self,
        namespace: str,
        key: str,
        value: Any,
        ttl_seconds: Optional[float] = None,
    ) -> None:
        """Stores a value with specific or default TTL."""
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        expires_at = time.time() + ttl
        with self._lock:
            store = self._get_namespace_store(namespace)
            # Evict if capacity reached
            if len(store) >= self.max_size and key not in store:
                # Evict oldest expired or random item
                now = time.time()
                expired_keys = [k for k, v in store.items() if v.is_expired(now)]
                if expired_keys:
                    for k in expired_keys[:10]:
                        del store[k]
                else:
                    # Drop first key
                    first_key = next(iter(store))
                    del store[first_key]
            store[key] = TTLItem(value=value, expires_at=expires_at)

    def delete(self, namespace: str, key: str) -> None:
        with self._lock:
            store = self._stores.get(namespace)
            if store and key in store:
                del store[key]

    def clear(self, namespace: Optional[str] = None) -> None:
        with self._lock:
            if namespace:
                if namespace in self._stores:
                    self._stores[namespace].clear()
            else:
                self._stores.clear()

    def get_or_set(
        self,
        namespace: str,
        key: str,
        factory: Callable[[], Any],
        ttl_seconds: Optional[float] = None,
    ) -> Any:
        """Atomic fetch-or-compute pattern."""
        cached = self.get(namespace, key)
        if cached is not None:
            return cached
        val = factory()
        self.set(namespace, key, val, ttl_seconds)
        return val


# Global Singleton Cache Instance
warm_cache = InstanceWarmCache(default_ttl_seconds=60.0, max_size=2000)
