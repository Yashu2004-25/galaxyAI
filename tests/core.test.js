import { describe, expect, it } from 'vitest';
import { parseRoadmapJson, extractYouTubeId } from '../src/services/roadmapService.js';
import { filterChatModels, parseSSELine } from '../src/services/llm/groqProvider.js';
import { trimHistory } from '../src/services/chatUtils.js';

describe('roadmap helpers', () => {
  it('parses fenced JSON', () => { expect(parseRoadmapJson('```json\n{"title":"Path","steps":[]}\n```').title).toBe('Path'); });
  it('extracts YouTube ids from watch and short URLs', () => { expect(extractYouTubeId('https://www.youtube.com/watch?v=abcdefghijk')).toBe('abcdefghijk'); expect(extractYouTubeId('https://youtu.be/abcdefghijk')).toBe('abcdefghijk'); expect(extractYouTubeId('https://youtube.com/watch?v=bad')).toBeNull(); });
});
describe('chat helpers', () => {
  it('parses SSE chunks and completion marker', () => { expect(parseSSELine('data: {"choices":[{"delta":{"content":"hi"}}]}')).toEqual({ text: 'hi' }); expect(parseSSELine('data: [DONE]')).toEqual({ done: true }); });
  it('filters non-chat models', () => { expect(filterChatModels([{ id: 'llama-3', owned_by: 'x' }, { id: 'whisper-large' }, { id: 'tts-1' }]).map((x) => x.id)).toEqual(['llama-3']); });
  it('keeps system prompt and the latest history', () => { const result = trimHistory([{ role: 'system', content: 's' }, ...Array.from({ length: 25 }, (_, i) => ({ role: 'user', content: `${i}` }))], 20); expect(result.messages[0].role).toBe('system'); expect(result.messages).toHaveLength(21); expect(result.trimmed).toBe(true); });
});
