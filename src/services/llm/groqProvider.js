import { secureStore } from '../../lib/secureStore.js';

const BASE = 'https://api.groq.com/openai/v1';
export const FALLBACK_MODELS = ['llama-3.1-8b-instant'];
const excluded = ['whisper', 'tts', 'playai', 'orpheus', 'guard', 'prompt-guard', 'compound'];

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
    const models = filterChatModels(data.data).filter((model) => model.id !== 'groq/compound');
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

const CURRENT_QUESTION = /\b(today|currently|current|latest|recent|right now|this week|this month|this year|time|date|weather|news|price|stock|score|president|prime minister|ceo|richest|billionaire|election|schedule|who is .* (now|today)|what happened)\b/i;

/** Search DuckDuckGo for useful current context before answering time-sensitive questions. */
export async function searchCurrentContext(question) {
  if (!CURRENT_QUESTION.test(question)) return [];
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(question)}&format=json&no_html=1&skip_disambig=1`;
    let response;
    if (window.galaxy?.httpGet) {
      const native = await window.galaxy.httpGet(url, { Accept: 'application/json' });
      if (native.status < 200 || native.status >= 300) return [];
      return parseDuckDuckGo(JSON.parse(native.body));
    }
    if (window.Capacitor?.isNativePlatform?.()) {
      const { CapacitorHttp } = await import('@capacitor/core');
      const native = await CapacitorHttp.get({ url, headers: { Accept: 'application/json' }, connectTimeout: 15000, readTimeout: 15000 });
      if (native.status < 200 || native.status >= 300) return [];
      return parseDuckDuckGo(native.data);
    }
    response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return [];
    const data = await response.json();
    return parseDuckDuckGo(data);
  } catch {
    return [];
  }
}

function parseDuckDuckGo(data) {
    const results = [];
    if (data.AbstractText) results.push({ title: data.Heading || 'DuckDuckGo result', text: data.AbstractText, url: data.AbstractURL });
    for (const item of data.RelatedTopics ?? []) {
      if (item.Text) results.push({ title: item.Text, text: item.Text, url: item.FirstURL });
      for (const child of item.Topics ?? []) if (child.Text) results.push({ title: child.Text, text: child.Text, url: child.FirstURL });
    }
    return results.slice(0, 6);
}
