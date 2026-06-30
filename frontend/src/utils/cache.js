const cache = new Map();

export const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

export const setCached = (key, value, ttlMs = 60000) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

export const invalidateCache = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

export const fetchWithCache = async (key, fetcher, ttlMs = 60000) => {
  const cached = getCached(key);
  if (cached !== null) return cached;

  const value = await fetcher();
  setCached(key, value, ttlMs);
  return value;
};
