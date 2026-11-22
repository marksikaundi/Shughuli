import { create } from 'zustand';

type ComposerRequest = {
  date: string;
  nonce: number;
};

type ComposerState = {
  request: ComposerRequest | null;
  openForDate: (date: string) => void;
  clear: () => void;
};

export const useComposerStore = create<ComposerState>((set) => ({
  request: null,
  openForDate: (date) =>
    set((state) => ({
      request: { date, nonce: (state.request?.nonce ?? 0) + 1 },
    })),
  clear: () => set({ request: null }),
}));
