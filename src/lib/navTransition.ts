export type TransitionType = 'overlay' | 'exit';

export interface TransitionState {
  active: boolean;
  url: string;
  title?: string;
  icon?: string;
  type: TransitionType;
}

let currentState: TransitionState = { active: false, url: '', type: 'overlay' };
const listeners = new Set<(state: TransitionState) => void>();

export function subscribe(callback: (state: TransitionState) => void) {
  listeners.add(callback);
  callback(currentState);
  return () => {
    listeners.delete(callback);
  };
}

export function getSnapshot(): TransitionState {
  return currentState;
}

export function triggerTransition(
  url: string,
  title?: string,
  icon?: string,
  type: TransitionType = 'overlay'
) {
  currentState = { active: true, url, title, icon, type };
  listeners.forEach((l) => l(currentState));

  // Delay navigation so the transition visual is visible
  setTimeout(() => {
    window.location.href = url;
  }, 450);
}
