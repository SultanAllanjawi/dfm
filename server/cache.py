"""Simple in-memory TTL cache — replaces Streamlit's st.cache_data for the API."""
import time
import threading


class TTLCache:
    def __init__(self):
        self._store: dict = {}
        self._lock = threading.Lock()

    def get(self, key):
        with self._lock:
            item = self._store.get(key)
            if item is None:
                return None
            value, expires_at = item
            if time.time() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key, value, ttl_seconds: float):
        with self._lock:
            self._store[key] = (value, time.time() + ttl_seconds)

    def clear_ticker(self, ticker: str):
        """Drop every cached entry whose key starts with this ticker."""
        with self._lock:
            for key in list(self._store):
                if isinstance(key, tuple) and key and key[0] == ticker:
                    del self._store[key]


signal_cache = TTLCache()   # (ticker, confidence) -> signal payload, ~1h TTL
price_cache = TTLCache()    # ticker -> live price, 30s TTL
scanner_cache = TTLCache()  # "all" -> scan results, ~30min TTL
