import { css, html, LitElement, nothing, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { INDEX_LETTERS } from '../utils/browse-index-utils';

/** Smallest comfortable height for one letter. Below this, letters are collapsed with dots (like iOS). */
const MIN_LETTER_HEIGHT = 15;

/**
 * Vertical A–Z rail for touch screens. Tap or slide a finger along it to jump through a long list.
 * Fires `letter-selected` with `{ letter }` each time the letter under the finger changes.
 */
export class AlphaRail extends LitElement {
  /** Letters that have items; the others are dimmed but still reachable. */
  @property({ attribute: false }) available: Set<string> = new Set();
  /** Letter of the first visible item, highlighted. */
  @property() current = '';
  @state() private active = false;
  @state() private activeLetter = '';
  @state() private bubbleTop = 0;
  @state() private step = 1;
  private resizeObserver?: ResizeObserver;

  connectedCallback() {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver(() => this.computeStep());
    this.resizeObserver.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
  }

  private computeStep() {
    const height = this.clientHeight;
    if (!height) {
      return;
    }
    const fits = Math.floor(height / MIN_LETTER_HEIGHT);
    this.step = fits >= INDEX_LETTERS.length ? 1 : Math.ceil((INDEX_LETTERS.length * 2 - 1) / Math.max(fits, 3));
  }

  /** Letters to draw; when space is short, keep every n-th letter with a dot in between. */
  private visibleEntries(): { label: string; letter: string }[] {
    if (this.step <= 1) {
      return INDEX_LETTERS.map((letter) => ({ label: letter, letter }));
    }
    const entries: { label: string; letter: string }[] = [];
    for (let i = 0; i < INDEX_LETTERS.length; i += this.step) {
      if (i > 0) {
        entries.push({ label: '•', letter: INDEX_LETTERS[Math.max(0, i - Math.ceil(this.step / 2))] });
      }
      entries.push({ label: INDEX_LETTERS[i], letter: INDEX_LETTERS[i] });
    }
    const last = INDEX_LETTERS[INDEX_LETTERS.length - 1];
    if (entries[entries.length - 1].letter !== last) {
      entries.push({ label: '•', letter: INDEX_LETTERS[INDEX_LETTERS.length - 2] }, { label: last, letter: last });
    }
    return entries;
  }

  private letterAt(clientY: number): string {
    const list = this.renderRoot.querySelector('.letters') as HTMLElement | null;
    const rect = (list ?? this).getBoundingClientRect();
    const ratio = Math.min(0.9999, Math.max(0, (clientY - rect.top) / rect.height));
    this.bubbleTop = Math.min(rect.height, Math.max(0, clientY - rect.top)) + (rect.top - this.getBoundingClientRect().top);
    return INDEX_LETTERS[Math.floor(ratio * INDEX_LETTERS.length)];
  }

  private select(clientY: number) {
    const letter = this.letterAt(clientY);
    if (letter !== this.activeLetter) {
      this.activeLetter = letter;
      if (this.active) {
        navigator.vibrate?.(6);
      }
      this.dispatchEvent(new CustomEvent('letter-selected', { detail: { letter }, bubbles: true, composed: true }));
    }
  }

  private onPointerDown = (ev: PointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
    this.active = true;
    this.activeLetter = '';
    this.select(ev.clientY);
  };

  private onPointerMove = (ev: PointerEvent) => {
    if (!this.active) {
      return;
    }
    ev.preventDefault();
    this.select(ev.clientY);
  };

  private onPointerUp = (ev: PointerEvent) => {
    (ev.currentTarget as HTMLElement).releasePointerCapture?.(ev.pointerId);
    this.active = false;
  };

  protected updated(changed: PropertyValues) {
    if (changed.has('step') || !this.hasUpdated) {
      this.toggleAttribute('compact', this.step > 1);
    }
  }

  render() {
    const highlighted = this.active ? this.activeLetter : this.current;
    return html`
      <div
        class="track ${classMap({ active: this.active })}"
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
        @touchstart=${(e: Event) => e.stopPropagation()}
      >
        <div class="letters">
          ${this.visibleEntries().map(
            ({ label, letter }) =>
              html`<span
                class=${classMap({
                  dot: label === '•',
                  empty: label !== '•' && !this.available.has(letter),
                  current: label !== '•' && letter === highlighted,
                })}
                >${label}</span
              >`,
          )}
        </div>
      </div>
      ${
        this.active && this.activeLetter
          ? html`<div class="bubble ${classMap({ empty: !this.available.has(this.activeLetter) })}" style="top:${this.bubbleTop}px">
              <b>${this.activeLetter}</b>
            </div>`
          : nothing
      }
    `;
  }

  static get styles() {
    return css`
      :host {
        position: absolute;
        top: 4px;
        bottom: 4px;
        right: 0;
        width: 34px;
        z-index: 4;
        display: flex;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      .track {
        flex: 1;
        display: flex;
        justify-content: center;
        padding: 4px 0;
        touch-action: none;
        cursor: pointer;
      }
      .letters {
        width: 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        border-radius: 12px;
        padding: 6px 0;
        background: rgba(var(--rgb-card-background-color, 40, 40, 40), 0.55);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        transition:
          background 0.15s,
          box-shadow 0.15s;
      }
      .track.active .letters {
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.16);
        box-shadow: 0 0 0 1px rgba(var(--rgb-primary-color, 3, 169, 244), 0.35) inset;
      }
      span {
        font-size: 11px;
        line-height: 1;
        font-weight: 600;
        color: var(--primary-text-color);
        min-width: 20px;
        text-align: center;
        transition:
          color 0.12s,
          transform 0.12s;
      }
      span.empty {
        opacity: 0.3;
      }
      span.dot {
        font-size: 8px;
        opacity: 0.5;
      }
      span.current {
        color: var(--accent-color, var(--primary-color));
        transform: scale(1.35);
      }
      .bubble {
        position: absolute;
        right: 48px;
        width: 64px;
        height: 64px;
        margin-top: -32px;
        border-radius: 32px 32px 4px 32px;
        background: var(--accent-color, var(--primary-color));
        color: var(--text-primary-color, #fff);
        font-size: 32px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
        pointer-events: none;
        transform: rotate(-45deg);
      }
      .bubble.empty {
        opacity: 0.6;
      }
      .bubble b {
        /* keep the letter upright inside the rotated tear-drop */
        transform: rotate(45deg);
        line-height: 1;
      }
    `;
  }
}

if (!customElements.get('sonos-alpha-rail')) {
  customElements.define('sonos-alpha-rail', AlphaRail);
}
