/** What a plain tap on ▶ does in the library: kept per device (a kitchen screen and a phone can differ). */
export type TapAction = 'replace' | 'next' | 'add';
const KEY = 'sonos-card-tap-action';

export function getTapAction(): TapAction {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'next' || value === 'add' ? value : 'replace';
  } catch {
    return 'replace';
  }
}

export function setTapAction(action: TapAction) {
  try {
    localStorage.setItem(KEY, action);
  } catch {
    // ignore
  }
}
