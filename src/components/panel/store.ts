import { useEffect } from 'react';
import { create } from 'zustand';

type PanelState = {
  panels: Record<string, boolean>;
  register: (key: string, defaultOpened: boolean) => void;
  toggle: (key: string) => void;
  open: (key: string) => void;
  close: (key: string) => void;
};

export const usePanelStore = create<PanelState>((set, get) => ({
  panels: {},
  register: (key, defaultOpened) => {
    if (!(key in get().panels)) {
      set({ panels: { ...get().panels, [key]: defaultOpened } });
    }
  },
  toggle: (key) => set((s) => ({ panels: { ...s.panels, [key]: !s.panels[key] } })),
  open: (key) => set((s) => ({ panels: { ...s.panels, [key]: true } })),
  close: (key) => set((s) => ({ panels: { ...s.panels, [key]: false } })),
}));

export function usePanelState(key: string, defaultOpened = false) {
  const register = usePanelStore((s) => s.register);
  useEffect(() => { register(key, defaultOpened); }, [register, key, defaultOpened]);
  return usePanelStore((s) => s.panels[key] ?? defaultOpened);
}
