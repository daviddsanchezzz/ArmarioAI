import type { GarmentCategory, GarmentColor, Season } from '@armario/shared';
import { create } from 'zustand';

interface FiltersState {
  category: GarmentCategory | null;
  color: GarmentColor | null;
  season: Season | null;
  setCategory: (category: GarmentCategory | null) => void;
  setColor: (color: GarmentColor | null) => void;
  setSeason: (season: Season | null) => void;
  reset: () => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  category: null,
  color: null,
  season: null,
  setCategory: (category) => set({ category }),
  setColor: (color) => set({ color }),
  setSeason: (season) => set({ season }),
  reset: () => set({ category: null, color: null, season: null }),
}));
