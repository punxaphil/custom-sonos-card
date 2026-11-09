import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LongPress, LONG_PRESS_MS } from '../../src/utils/long-press';

function pointer(type: string, target: HTMLElement, x = 10, y = 10) {
  return { type, clientX: x, clientY: y, button: 0, currentTarget: target } as unknown as PointerEvent;
}

describe('LongPress', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fires after holding and ignores the click that ends the press', () => {
    const el = Object.assign(document.createElement('div'), { item: { title: 'Queen' } });
    const spy = vi.fn();
    const lp = new LongPress(spy);
    lp.down(pointer('pointerdown', el));
    vi.advanceTimersByTime(LONG_PRESS_MS + 10);
    expect(spy).toHaveBeenCalledWith({ title: 'Queen' }, el);
    expect(lp.consumeClick()).toBe(true);
    expect(lp.consumeClick()).toBe(false);
  });

  it('does not fire when the finger moves (scrolling) or lifts early', () => {
    const el = document.createElement('div');
    const spy = vi.fn();
    const lp = new LongPress(spy);
    lp.down(pointer('pointerdown', el));
    lp.move(pointer('pointermove', el, 10, 40));
    vi.advanceTimersByTime(LONG_PRESS_MS + 10);
    lp.down(pointer('pointerdown', el));
    vi.advanceTimersByTime(100);
    lp.up();
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(spy).not.toHaveBeenCalled();
    expect(lp.consumeClick()).toBe(false);
  });
});
