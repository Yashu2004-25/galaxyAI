/** Trim chat history to the most recent messages while reserving room for the system prompt. */
export function trimHistory(messages, limit = 20) {
  const system = messages.filter((m) => m.role === 'system'); const rest = messages.filter((m) => m.role !== 'system');
  return { messages: [...system, ...rest.slice(-limit)], trimmed: rest.length > limit };
}
/** Build a study-mode system prompt, allowing per-mode user overrides. */
export function getModePrompt(mode, overrides = {}) {
  const prompts = { tutor: 'Explain step by step in simple language, use examples, and end by checking understanding with a question.', quiz: 'Ask one question at a time about the selected topic. Wait for the learner, then grade and explain their answer.', summarize: 'Turn pasted notes into concise bullet summaries and useful flashcards.', code: 'Explain and fix code. Show a complete corrected snippet and explain key changes.', writer: 'Draft and improve clear, polished emails, essays, and reports.', general: 'Be a helpful, accurate general assistant.' };
  return overrides[mode] || prompts[mode] || prompts.general;
}
