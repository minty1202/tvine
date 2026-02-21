import { atom, useAtom } from 'jotai';

const panelAtoms = new Map<string, ReturnType<typeof atom<boolean>>>();

function getPanelAtom(key: string, defaultOpened = false) {
  const existing = panelAtoms.get(key);
  if (existing) return existing;

  const newAtom = atom(defaultOpened);
  panelAtoms.set(key, newAtom);
  return newAtom;
}

type PanelActions = {
  toggle: () => void;
  open: () => void;
  close: () => void;
};

export function usePanel(
  key: string,
  defaultOpened = false,
): [boolean, PanelActions] {
  const [value, set] = useAtom(getPanelAtom(key, defaultOpened));

  const actions: PanelActions = {
    toggle: () => set((prev) => !prev),
    open: () => set(true),
    close: () => set(false),
  };

  return [value, actions];
}

export function resetPanelAtoms() {
  panelAtoms.clear();
}
