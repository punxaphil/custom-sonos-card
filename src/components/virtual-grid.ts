import { html, LitElement, nothing, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

/** Rows rendered above and below the visible area, so fast flicks don't show empty space. */
const BUFFER_ROWS = 3;

/**
 * Minimal virtual scroller for items of a fixed size (list rows or grid tiles).
 *
 * Only the visible rows are in the DOM, so folders with thousands of items stay smooth. Unlike
 * @lit-labs/virtualizer it never measures with getBoundingClientRect: every number comes from
 * scrollTop / clientWidth / clientHeight, which share the element's own coordinate system. That
 * keeps it correct when a theme or card_mod applies `zoom` or `transform: scale()` to the card.
 *
 * Fires `visible-changed` with `{ first }` (index of the first visible item) while scrolling.
 */
export class VirtualGrid<T = unknown> extends LitElement {
  @property({ attribute: false }) items: T[] = [];
  @property({ attribute: false }) renderItem!: (item: T, index: number) => TemplateResult;
  @property({ attribute: false }) keyFunction?: (item: T, index: number) => unknown;
  /** 'list': one column of `rowHeight` rows. 'grid': `columns` tiles per row. */
  @property() layout: 'list' | 'grid' = 'list';
  @property({ type: Number }) rowHeight = 72;
  /** Number of columns in grid layout; 0 = as many as fit `minItemWidth`. */
  @property({ type: Number }) columns = 0;
  @property({ type: Number }) minItemWidth = 140;
  /** Grid: thumbnail height / width. */
  @property({ type: Number }) aspect = 1;
  /** Grid: extra height under the thumbnail (title line). */
  @property({ type: Number }) extraHeight = 32;
  @property({ type: Number }) gap = 8;
  @property({ type: Number }) padding = 8;

  @state() private startRow = 0;
  @state() private endRow = 0;
  @state() private width = 0;
  @state() private height = 0;
  private resizeObserver?: ResizeObserver;
  private frame = 0;
  private lastFirst = -1;
  private pendingIndex?: number;

  /** Render in the light DOM so the items keep the styles of the component that hosts the grid. */
  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    Object.assign(this.style, {
      display: 'block',
      position: 'relative',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      overscrollBehavior: 'contain',
      contain: 'strict',
    });
    this.addEventListener('scroll', this.onScroll, { passive: true });
    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('scroll', this.onScroll);
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.frame);
  }

  private get metrics() {
    const isGrid = this.layout === 'grid';
    const padding = isGrid ? this.padding : 0;
    const gap = isGrid ? this.gap : 0;
    const inner = Math.max(0, this.width - 2 * padding);
    const columns = isGrid ? Math.max(1, this.columns || Math.floor((inner + gap) / (this.minItemWidth + gap)) || 1) : 1;
    const itemWidth = isGrid ? (inner - gap * (columns - 1)) / columns : inner;
    const itemHeight = isGrid ? itemWidth * this.aspect + this.extraHeight : this.rowHeight;
    const rowPitch = Math.max(1, itemHeight + gap);
    const rows = Math.ceil(this.items.length / columns);
    const total = rows ? 2 * padding + rows * rowPitch - gap : 0;
    return { padding, gap, columns, itemWidth, itemHeight, rowPitch, rows, total };
  }

  private measure() {
    this.width = this.clientWidth;
    this.height = this.clientHeight;
    this.updateRange();
    if (this.pendingIndex !== undefined && this.width) {
      const index = this.pendingIndex;
      this.pendingIndex = undefined;
      this.scrollToIndex(index);
    }
  }

  private onScroll = () => {
    if (!this.frame) {
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.updateRange();
      });
    }
  };

  private updateRange() {
    const { padding, rowPitch, rows, columns } = this.metrics;
    const top = Math.max(0, this.scrollTop - padding);
    const firstRow = Math.floor(top / rowPitch);
    const visibleRows = Math.ceil((this.height || 800) / rowPitch) + 1;
    const startRow = Math.max(0, firstRow - BUFFER_ROWS);
    const endRow = Math.min(rows, firstRow + visibleRows + BUFFER_ROWS);
    if (startRow !== this.startRow || endRow !== this.endRow) {
      this.startRow = startRow;
      this.endRow = endRow;
    }
    // first item whose row is at least half visible
    const first = Math.min(this.items.length - 1, Math.max(0, Math.round(top / rowPitch) * columns));
    if (first !== this.lastFirst) {
      this.lastFirst = first;
      this.dispatchEvent(new CustomEvent('visible-changed', { detail: { first } }));
    }
  }

  /** Scroll so the row holding `index` is at the top. */
  scrollToIndex(index: number) {
    if (!this.width) {
      this.pendingIndex = index;
      return;
    }
    const { padding, rowPitch, columns } = this.metrics;
    const row = Math.floor(Math.max(0, index) / columns);
    this.scrollTop = row === 0 ? 0 : padding + row * rowPitch;
    this.updateRange();
  }

  protected willUpdate(changed: PropertyValues) {
    if (changed.has('items') || changed.has('columns') || changed.has('layout')) {
      this.lastFirst = -1;
      if (this.width) {
        // recompute range synchronously for the new items
        const { rows, rowPitch } = this.metrics;
        const visibleRows = Math.ceil((this.height || 800) / rowPitch) + 1;
        const firstRow = Math.floor(Math.max(0, this.scrollTop) / rowPitch);
        this.startRow = Math.min(Math.max(0, firstRow - BUFFER_ROWS), rows);
        this.endRow = Math.min(rows, firstRow + visibleRows + BUFFER_ROWS);
      }
    }
  }

  render() {
    if (!this.width) {
      return html`<div style="height:1px"></div>`;
    }
    const { padding, gap, columns, itemWidth, itemHeight, rowPitch, total } = this.metrics;
    const indices: number[] = [];
    const last = Math.min(this.items.length, this.endRow * columns);
    for (let i = this.startRow * columns; i < last; i++) {
      indices.push(i);
    }
    return html`
      <div style="position:relative;width:100%;height:${total}px">
        ${repeat(
          indices,
          (i) => (this.keyFunction ? this.keyFunction(this.items[i], i) : i),
          (i) => {
            const row = Math.floor(i / columns);
            const col = i % columns;
            const x = padding + col * (itemWidth + gap);
            const y = padding + row * rowPitch;
            return html`<div
              class="vg-cell"
              style="position:absolute;top:0;left:0;box-sizing:border-box;transform:translate(${x}px,${y}px);width:${itemWidth}px;height:${itemHeight}px"
            >
              ${this.items[i] !== undefined ? this.renderItem(this.items[i], i) : nothing}
            </div>`;
          },
        )}
      </div>
    `;
  }
}

if (!customElements.get('sonos-virtual-grid')) {
  customElements.define('sonos-virtual-grid', VirtualGrid);
}
