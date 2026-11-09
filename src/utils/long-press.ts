/** How long a finger must stay down to count as a long press (ms). */
export const LONG_PRESS_MS = 500;
/** Moving more than this (px) means the user is scrolling, not pressing. */
const MOVE_TOLERANCE = 10;

type WithItem = HTMLElement & { item?: unknown };

/**
 * Long-press detection for list rows and grid tiles, by touch or mouse (and right-click).
 * Bind `down`, `move`, `up` and `contextmenu` on the element that carries `.item`; call
 * `consumeClick()` at the top of the element's click handler so the click that ends a long press
 * does not also play or open the item.
 */
export class LongPress<T = unknown> {
  private timer?: ReturnType<typeof setTimeout>;
  private startX = 0;
  private startY = 0;
  private fired = false;

  constructor(private readonly onLongPress: (item: T, element: HTMLElement) => void) {}

  down = (ev: PointerEvent) => {
    if (ev.button > 0) {
      return;
    }
    this.cancel();
    this.fired = false;
    this.startX = ev.clientX;
    this.startY = ev.clientY;
    const element = ev.currentTarget as WithItem;
    this.timer = setTimeout(() => this.fire(element), LONG_PRESS_MS);
  };

  move = (ev: PointerEvent) => {
    if (this.timer && Math.hypot(ev.clientX - this.startX, ev.clientY - this.startY) > MOVE_TOLERANCE) {
      this.cancel();
    }
  };

  up = () => this.cancel();

  /** Right-click, or the long-press gesture of browsers that turn it into a context menu. */
  contextmenu = (ev: Event) => {
    ev.preventDefault();
    if (!this.fired) {
      this.cancel();
      this.fire(ev.currentTarget as WithItem);
    }
  };

  /** True (once) when the current click is the end of a long press and must be ignored. */
  consumeClick(): boolean {
    if (this.fired) {
      this.fired = false;
      return true;
    }
    return false;
  }

  private fire(element: WithItem) {
    this.timer = undefined;
    this.fired = true;
    navigator.vibrate?.(15);
    this.onLongPress(element.item as T, element);
    // Lifting the finger sends a click to whatever is now under it (often the sheet that just
    // opened). Swallow that single click, wherever it lands.
    const swallow = (ev: Event) => {
      ev.stopPropagation();
      ev.preventDefault();
    };
    const stop = () => window.removeEventListener('click', swallow, { capture: true });
    window.addEventListener('click', swallow, { capture: true, once: true });
    // the click follows the finger lifting: stop swallowing shortly after that
    window.addEventListener('pointerup', () => setTimeout(stop, 350), { capture: true, once: true });
    setTimeout(stop, 10000);
  }

  private cancel() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
