import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(persist((set) => ({ model: 'llama-3.3-70b-versatile', searchModel: 'groq/compound', roadmapModel: 'groq/compound', fastModel: 'llama-3.3-70b-versatile', favorites: [], customModels: [], temperature: 0.6, maxTokens: 2048, systemPrompts: {}, set: (values) => set(values), toggleFavorite: (id) => set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] })), addModel: (id) => set((s) => ({ customModels: [...new Set([...s.customModels, id.trim()])] })) }), { name: 'galaxy-settings' }));
