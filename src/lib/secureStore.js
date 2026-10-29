import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

const desktop = () => typeof window !== 'undefined' && Boolean(window.galaxy?.secure);
/** Encrypted cross-platform secret storage. Browser fallback is only suitable for development. */
export const secureStore = {
  async get(key) {
    if (desktop()) return window.galaxy.secure.get(key);
    if (Capacitor.isNativePlatform()) { try { const result = await SecureStoragePlugin.get({ key }); return result.value ?? null; } catch { return null; } }
    return localStorage.getItem(`dev-secret:${key}`);
  },
  async set(key, value) {
    if (desktop()) return window.galaxy.secure.set(key, value);
    if (Capacitor.isNativePlatform()) return SecureStoragePlugin.set({ key, value });
    localStorage.setItem(`dev-secret:${key}`, value);
  },
  async remove(key) {
    if (desktop()) return window.galaxy.secure.remove(key);
    if (Capacitor.isNativePlatform()) { try { return await SecureStoragePlugin.remove({ key }); } catch { return; } }
    localStorage.removeItem(`dev-secret:${key}`);
  }
};
