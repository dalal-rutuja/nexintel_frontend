// src/utils/cache.js

const cache = new Map();

export const getCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;

  const now = new Date().getTime();
  if (now > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.value;
};

export const setCache = (key, value, ttl = 300000) => { // Default TTL 5 minutes
  const now = new Date().getTime();
  const expiry = now + ttl;
  cache.set(key, { value, expiry });
};

export const invalidateCache = (key) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};