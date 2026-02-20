import { atom, useAtom } from 'jotai';

const panelAtoms = new Map<string, ReturnType<typeof atom<boolean>>>();

function getPanelAtom(key: string, defaultOpened = false) {
  if (!panelAtoms.has(key)) {
    panelAtoms.set(key, atom(defaultOpened));
  }
  return panelAtoms.get(key)!;
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
