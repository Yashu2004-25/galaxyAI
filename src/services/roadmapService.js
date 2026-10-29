import { secureStore } from '../lib/secureStore.js';
import { nativeFetch } from '../lib/http.js';
import { useSettingsStore } from '../store/useSettingsStore.js';

const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
/** Extract a YouTube video identifier from common watch, shorts and embed URLs. */
export function extractYouTubeId(value) {
  try {
    const url = new URL(value);
    const id = url.hostname.endsWith('youtu.be') ? url.pathname.slice(1) : url.searchParams.get('v') ?? url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
/** Parse model JSON that may be wrapped in Markdown code fences. */
export function parseRoadmapJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('The roadmap response did not contain JSON. Please try again.');
  const data = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(data.steps)) throw new Error('The roadmap response is missing its learning steps. Please try again.');
  return data;
}
async function groq(body, key) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(endpoint, { method: 'POST', signal: controller.signal, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) { const err = await response.json().catch(() => ({})); if (response.status === 401) throw new Error('Groq rejected your key. Check it in Settings.'); if (response.status === 429) throw new Error('Groq rate limit reached. Wait a little and retry.'); throw new Error(err.error?.message ?? `Groq request failed (${response.status}).`); }
    return (await response.json()).choices?.[0]?.message?.content ?? '';
  } catch (error) { if (error.name === 'AbortError') throw new Error('The roadmap request timed out. Please retry.'); if (error instanceof TypeError) throw new Error('Network error while contacting Groq. Check your connection and retry.'); throw error; }
  finally { clearTimeout(timer); }
}
async function verifyResource(resource, topic) {
  const id = extractYouTubeId(resource.url); if (!id) return null;
  const key = await secureStore.get('youtube-api-key');
  try {
    if (key) {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos'); url.search = new URLSearchParams({ part: 'snippet,contentDetails', id, key }).toString();
      const response = await nativeFetch(url.toString(), { timeout: 12000 }); if (!response.ok || !(await response.json()).items?.length) return null;
    } else {
      const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
      const response = await nativeFetch(url, { timeout: 12000 }); if (!response.ok) return null;
    }
    return { ...resource, url: `https://www.youtube.com/watch?v=${id}`, video_id: id };
  } catch { return null; }
}
/** Research, structure, and verify an ordered study roadmap. */
export async function generateRoadmap({ topic, level, hours, goal, onStage }) {
  const key = await secureStore.get('groq-api-key'); if (!key) throw new Error('Add your Groq API key in Settings to create a roadmap.');
  const settings = useSettingsStore.getState();
  onStage?.('Searching the web');
  const research = await groq({ model: settings.roadmapModel, messages: [{ role: 'user', content: `Research a high-quality free learning path for: ${topic}. Learner level: ${level}. Study time: ${hours} hours/week. Goal: ${goal || 'build a strong practical foundation'}. Use web search. Find prerequisites, learning order, subtopics, and real YouTube courses/playlists/videos with exact title, channel, URL per stage. Return detailed notes.` }] }, key);
  onStage?.('Building your path');
  const schema = { title: 'string', overview: 'string', steps: [{ order: 1, title: 'string', goal: 'string', duration: 'string', topics: ['string'], resources: [{ order: 1, title: 'string', channel: 'string', url: 'string', duration_hint: 'string', why: 'string' }] }] };
  let roadmap;
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await groq({ model: settings.fastModel, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: `Return ONLY valid JSON matching this structure: ${JSON.stringify(schema)}. Produce 5-10 ordered steps and 2-5 YouTube videos per step. Keep resources in watch order.` }, { role: 'user', content: `Topic: ${topic}\nLevel: ${level}\nHours/week: ${hours}\nGoal: ${goal || 'General mastery'}\n\nResearch notes:\n${research}` }] }, key);
    try { roadmap = parseRoadmapJson(text); break; } catch (error) { if (attempt) throw error; }
  }
  onStage?.('Verifying videos');
  for (const step of roadmap.steps) {
    const verified = [];
    for (const resource of [...(step.resources ?? [])].sort((a, b) => a.order - b.order)) { const result = await verifyResource(resource, topic); if (result) verified.push(result); }
    if (verified.length < 2) verified.push({ order: verified.length + 1, title: 'Search YouTube for this step', channel: 'YouTube', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${step.title} ${topic}`)}`, duration_hint: '', why: 'Find current lessons and playlists for this topic.' });
    step.resources = verified;
  }
  return roadmap;
}
