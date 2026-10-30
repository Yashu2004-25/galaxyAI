const STORAGE_KEY = 'galaxy-local-data';

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{"roadmaps":[],"chats":[]}');
  } catch {
    return { roadmaps: [], chats: [] };
  }
}

function write(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function listRoadmaps() { return read().roadmaps; }
export async function saveRoadmap(_userId, input, roadmap) {
  const data = read();
  const row = { id: crypto.randomUUID(), topic: input.topic, level: input.level, hours_per_week: input.hours, title: roadmap.title, overview: roadmap.overview, created_at: new Date().toISOString(), roadmap_steps: roadmap.steps.map((step, index) => ({ id: crypto.randomUUID(), roadmap_id: null, step_order: step.order ?? index + 1, title: step.title, goal: step.goal, duration: step.duration, topics: step.topics ?? [], resources: (step.resources ?? []).map((resource, resourceIndex) => ({ ...resource, id: crypto.randomUUID(), resource_order: resource.order ?? resourceIndex + 1 })), is_done: false })) };
  row.roadmap_steps.forEach((step) => { step.roadmap_id = row.id; });
  data.roadmaps.unshift(row);
  write(data);
  return row;
}
export async function setStepDone(id, done) {
  const data = read();
  for (const roadmap of data.roadmaps) {
    const step = roadmap.roadmap_steps.find((item) => item.id === id);
    if (step) { step.is_done = done; write(data); return step; }
  }
  return null;
}
export async function deleteRoadmap(id) {
  const data = read(); data.roadmaps = data.roadmaps.filter((item) => item.id !== id); write(data); return true;
}
export async function listChats() { return read().chats; }
export async function loadMessages(chatId) { return read().chats.find((chat) => chat.id === chatId)?.messages ?? []; }
export async function createChat(_userId, mode = 'general', title = 'New chat') {
  const data = read(); const chat = { id: crypto.randomUUID(), mode, title, updated_at: new Date().toISOString(), messages: [] }; data.chats.unshift(chat); write(data); return chat;
}
export async function insertMessage(_userId, chatId, role, content, model) {
  const data = read(); const chat = data.chats.find((item) => item.id === chatId);
  if (!chat) throw new Error('This conversation could not be found.');
  const message = { id: crypto.randomUUID(), chat_id: chatId, role, content, model, created_at: new Date().toISOString() };
  chat.messages.push(message); chat.updated_at = message.created_at; write(data); return message;
}
export async function renameChat(id, title) {
  const data = read(); const chat = data.chats.find((item) => item.id === id);
  if (chat) { chat.title = title; write(data); }
  return chat ?? null;
}
export async function deleteChat(id) {
  const data = read(); data.chats = data.chats.filter((item) => item.id !== id); write(data); return true;
}
export async function touchChat(id, values = {}) {
  const data = read(); const chat = data.chats.find((item) => item.id === id);
  if (chat) { Object.assign(chat, values, { updated_at: new Date().toISOString() }); write(data); }
  return chat ?? null;
}
