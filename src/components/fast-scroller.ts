import { css, html, LitElement, nothing, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

const MIN_THUMB = 56;

/**
 * Wide, finger-friendly scroll handle that replaces the 3–6 px native scrollbar on touch screens.
 * Drag the thumb to scroll, or touch the track to jump there. While dragging, a bubble shows the
 * position ("2 450 / 5 232" when `total` is set).
 *
 * Place it inside a positioned parent, next to the scrolling element given as `target`; it hides
 * itself while the target does not scroll.
 */
export class FastScroller extends LitElement {
  @property({ attribute: false }) target?: HTMLElement;
  /** Number of items in the target, for the position bubble. */
  @property({ type: Number }) total = 0;
  @state() private ratio = 0;
  @state() private visibleFraction = 1;
  @state() private dragging = false;
  @state() private scrollable = false;
  @state() private trackHeight = 0;
  private grabOffset = 0;
  private observed?: HTMLElement;
  private resizeObserver = new ResizeObserver(() => this.sync());
  private frame = 0;

  disconnectedCallback() {
    super.disconnectedCallback();
    this.detach();
    this.resizeObserver.disconnect();
  }

  connectedCallback() {
    super.connectedCallback();
    this.resizeObserver.observe(this);
    if (this.target) {
      this.attach(this.target);
    }
  }

  protected willUpdate(changed: PropertyValues) {
    if (changed.has('target') && this.target !== this.observed) {
      this.detach();
      if (this.target) {
        this.attach(this.target);
      }
    }
  }

  private attach(target: HTMLElement) {
    this.observed = target;
    target.addEventListener('scroll', this.onScroll, { passive: true });
    this.resizeObserver.observe(target);
    // content height changes (items loaded) do not resize the target: poll lightly via scroll + timer
    this.sync();
    setTimeout(() => this.sync(), 300);
  }

  private detach() {
    if (this.observed) {
      this.observed.removeEventListener('scroll', this.onScroll);
      this.resizeObserver.unobserve(this.observed);
      this.observed = undefined;
    }
  }

  private onScroll = () => {
    if (!this.frame) {
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.sync();
      });
    }
  };

  /** Re-read the target's geometry (call after its content changed). */
  sync() {
    const t = this.observed;
    this.trackHeight = this.clientHeight;
    if (!t) {
      this.scrollable = false;
      return;
    }
    const max = t.scrollHeight - t.clientHeight;
    this.scrollable = max > 8;
    this.visibleFraction = t.scrollHeight ? t.clientHeight / t.scrollHeight : 1;
    if (!this.dragging) {
      this.ratio = max > 0 ? t.scrollTop / max : 0;
    }
  }

  private get thumbHeight() {
    return Math.min(this.trackHeight, Math.max(MIN_THUMB, this.trackHeight * this.visibleFraction));
  }

  private scrollToRatio(ratio: number) {
    const t = this.observed;
    if (!t) {
      return;
    }
    this.ratio = Math.min(1, Math.max(0, ratio));
    t.scrollTop = this.ratio * (t.scrollHeight - t.clientHeight);
  }

  /** Converts a pointer position into a scroll ratio, in the track's visual coordinates (zoom-safe). */
  private ratioAt(clientY: number) {
    const rect = this.getBoundingClientRect();
    const scale = this.clientHeight ? rect.height / this.clientHeight : 1;
    const thumb = this.thumbHeight * scale;
    const usable = rect.height - thumb;
    return usable > 0 ? (clientY - rect.top - this.grabOffset) / usable : 0;
  }

  private onPointerDown = (ev: PointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    const rect = this.getBoundingClientRect();
    const scale = this.clientHeight ? rect.height / this.clientHeight : 1;
    const thumb = this.thumbHeight * scale;
    const thumbTop = rect.top + this.ratio * (rect.height - thumb);
    const onThumb = ev.clientY >= thumbTop && ev.clientY <= thumbTop + thumb;
    // grab the thumb where it was touched, or centre it under the finger when the track was touched
    this.grabOffset = onThumb ? ev.clientY - thumbTop : thumb / 2;
    (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
    this.dragging = true;
    this.scrollToRatio(this.ratioAt(ev.clientY));
  };

  private onPointerMove = (ev: PointerEvent) => {
    if (this.dragging) {
      ev.preventDefault();
      this.scrollToRatio(this.ratioAt(ev.clientY));
    }
  };

  private onPointerUp = (ev: PointerEvent) => {
    (ev.currentTarget as HTMLElement).releasePointerCapture?.(ev.pointerId);
    this.dragging = false;
    this.sync();
  };

  private label() {
    if (this.total > 0) {
      const index = Math.round(this.ratio * (this.total - 1)) + 1;
      return `${index.toLocaleString()} / ${this.total.toLocaleString()}`;
    }
    return `${Math.round(this.ratio * 100)} %`;
  }

  protected updated() {
    this.toggleAttribute('hidden', !this.scrollable);
  }

  render() {
    if (!this.scrollable) {
      return nothing;
    }
    const thumb = this.thumbHeight;
    const top = this.ratio * (this.trackHeight - thumb);
    return html`
      <div
        class="track ${classMap({ dragging: this.dragging })}"
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
        @touchstart=${(e: Event) => e.stopPropagation()}
      >
        <div class="thumb" style="height:${thumb}px;transform:translateY(${top}px)"></div>
      </div>
      ${this.dragging ? html`<div class="bubble" style="top:${top + thumb / 2}px">${this.label()}</div>` : nothing}
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
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      :host([hidden]) {
        display: none;
      }
      .track {
        position: absolute;
        inset: 0;
        touch-action: none;
        cursor: pointer;
      }
      .track::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        width: 4px;
        margin-left: -2px;
        border-radius: 2px;
        background: rgba(127, 127, 127, 0.18);
      }
      .thumb {
        position: absolute;
        top: 0;
        left: 5px;
        right: 5px;
        border-radius: 12px;
        background: rgba(var(--rgb-primary-text-color, 225, 225, 225), 0.35);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        transition: background 0.15s;
      }
      .track.dragging .thumb {
        background: var(--accent-color, var(--primary-color));
      }
      .bubble {
        position: absolute;
        right: 44px;
        transform: translateY(-50%);
        padding: 8px 14px;
        border-radius: 18px;
        white-space: nowrap;
        background: var(--accent-color, var(--primary-color));
        color: var(--text-primary-color, #fff);
        font-weight: 600;
        font-size: 1rem;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
        pointer-events: none;
      }
    `;
  }
}

if (!customElements.get('sonos-fast-scroller')) {
  customElements.define('sonos-fast-scroller', FastScroller);
}
