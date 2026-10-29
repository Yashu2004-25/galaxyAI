import { Capacitor } from '@capacitor/core';
import { CapacitorHttp } from '@capacitor/core';

/** Request with a timeout; native platforms bypass webview CORS for public video APIs. */
export async function nativeFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout ?? 15000);
  try {
    if (typeof window !== 'undefined' && window.galaxy?.httpGet && (!options.method || options.method === 'GET')) {
      const result = await window.galaxy.httpGet(url, options.headers ?? {});
      return new Response(result.body, { status: result.status, headers: result.headers });
    }
    if (Capacitor.isNativePlatform() && (!options.method || options.method === 'GET')) {
      const response = await CapacitorHttp.get({ url, headers: options.headers ?? {}, connectTimeout: options.timeout ?? 15000, readTimeout: options.timeout ?? 15000 });
      return new Response(typeof response.data === 'string' ? response.data : JSON.stringify(response.data), { status: response.status, headers: response.headers });
    }
    return await fetch(url, { ...options, signal: controller.signal });
  } finally { clearTimeout(timer); }
}
