import { supabase } from '../lib/supabase.js';

/** Fetch data and convert Supabase errors to normal exceptions. */
function unwrap({ data, error }) { if (error) throw error; return data; }
export async function listRoadmaps(userId) { return unwrap(await supabase.from('roadmaps').select('*,roadmap_steps(*)').eq('user_id', userId).order('created_at', { ascending: false })); }
export async function saveRoadmap(userId, input, roadmap) {
  const row = unwrap(await supabase.from('roadmaps').insert({ user_id: userId, topic: input.topic, level: input.level, hours_per_week: input.hours, title: roadmap.title, overview: roadmap.overview }).select().single());
  for (const step of roadmap.steps) {
    const savedStep = unwrap(await supabase.from('roadmap_steps').insert({ roadmap_id: row.id, user_id: userId, step_order: step.order, title: step.title, goal: step.goal, duration: step.duration, topics: step.topics }).select().single());
    if (step.resources?.length) {
      const resources = step.resources.map((r, i) => ({ step_id: savedStep.id, user_id: userId, resource_order: r.order ?? i + 1, title: r.title, channel: r.channel, url: r.url, video_id: r.video_id ?? null, duration_hint: r.duration_hint, why: r.why }));
      unwrap(await supabase.from('resources').insert(resources));
    }
  }
  return row;
}
export async function setStepDone(id, done) { return unwrap(await supabase.from('roadmap_steps').update({ is_done: done }).eq('id', id)); }
export async function deleteRoadmap(id) { return unwrap(await supabase.from('roadmaps').delete().eq('id', id)); }
export async function listChats(userId) { return unwrap(await supabase.from('chats').select('*').eq('user_id', userId).order('updated_at', { ascending: false })); }
export async function loadMessages(chatId) { return unwrap(await supabase.from('chat_messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true })); }
export async function createChat(userId, mode = 'general', title = 'New chat') { return unwrap(await supabase.from('chats').insert({ user_id: userId, mode, title }).select().single()); }
export async function insertMessage(userId, chatId, role, content, model) { return unwrap(await supabase.from('chat_messages').insert({ user_id: userId, chat_id: chatId, role, content, model }).select().single()); }
export async function renameChat(id, title) { return unwrap(await supabase.from('chats').update({ title }).eq('id', id)); }
export async function deleteChat(id) { return unwrap(await supabase.from('chats').delete().eq('id', id)); }
export async function touchChat(id, values = {}) { return unwrap(await supabase.from('chats').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id)); }
