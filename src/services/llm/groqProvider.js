import { secureStore } from '../../lib/secureStore.js';

const BASE = 'https://api.groq.com/openai/v1';
export const FALLBACK_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'groq/compound'];
const excluded = ['whisper', 'tts', 'playai', 'orpheus', 'guard', 'prompt-guard'];

/** Convert an HTTP/API error into a useful message without exposing credentials. */
export function apiError(status, message = '') {
  if (status === 401) return 'Groq rejected this API key. Check it in Settings.';
  if (status === 404) return `Model not found. Refresh models or choose another. ${message}`.trim();
  if (status === 413 || /context.length/i.test(message)) return 'This conversation is too long. Start a new chat or shorten the history.';
  if (status === 429) return 'Groq rate limit reached. Wait a little or switch to a smaller model.';
  return message || `Groq request failed (${status}).`;
}
/** Filter model catalog to text chat models and normalize useful metadata. */
export function filterChatModels(models = []) {
  return models.filter((m) => m.id && !excluded.some((word) => m.id.toLowerCase().includes(word))).map((m) => ({ id: m.id, owner: m.owned_by ?? m.owner ?? '', context: m.context_window ?? m.context_length ?? null }));
}
/** Decode one server-sent event line. */
export function parseSSELine(line) {
  if (!line.startsWith('data:')) return null;
  const data = line.slice(5).trim();
  if (!data || data === '[DONE]') return data === '[DONE]' ? { done: true } : null;
  try { const parsed = JSON.parse(data); return { text: parsed.choices?.[0]?.delta?.content ?? '' }; } catch { return null; }
}
async function request(path, options = {}) {
  const key = await secureStore.get('groq-api-key');
  if (!key) throw new Error('Add your Groq API key in Settings to continue.');
  const response = await fetch(`${BASE}${path}`, { ...options, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(options.headers ?? {}) } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw Object.assign(new Error(apiError(response.status, body.error?.message)), { status: response.status }); }
  return response;
}
/** OpenAI-compatible Groq provider. streamChat yields text chunks as they arrive. */
export const groqProvider = {
  async listModels() {
    const response = await request('/models'); const data = await response.json();
    const models = filterChatModels(data.data);
    localStorage.setItem('galaxy-model-cache', JSON.stringify(models));
    return models;
  },
  async *streamChat(requestData) {
    const { signal, ...body } = requestData;
    let response;
    try { response = await request('/chat/completions', { method: 'POST', signal, body: JSON.stringify({ ...body, stream: true }) }); }
    catch (error) { if (error.name === 'AbortError') throw error; throw error; }
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/); buffer = lines.pop() ?? '';
        for (const line of lines) { const event = parseSSELine(line); if (event?.done) return; if (event?.text) yield event.text; }
      }
      if (buffer) { const event = parseSSELine(buffer); if (event?.text) yield event.text; }
    } finally { reader.releaseLock(); }
  },
  async complete(body) { const response = await request('/chat/completions', { method: 'POST', body: JSON.stringify({ ...body, stream: false }) }); return response.json(); }
};
