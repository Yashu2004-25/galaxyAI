import { create } from 'zustand';

export const useChatStore = create((set) => ({
  chats: [], activeChat: null, messages: [], loading: false, streaming: false,
  set: (values) => set(values),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  patchMessage: (id, changes) => set((s) => ({ messages: s.messages.map((m) => m.id === id ? { ...m, ...changes } : m) }))
}));
