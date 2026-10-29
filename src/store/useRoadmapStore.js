import { create } from 'zustand';

export const useRoadmapStore = create((set) => ({ roadmaps: [], active: null, loading: false, set: (values) => set(values) }));
