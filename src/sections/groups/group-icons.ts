import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

class GroupIcons extends LitElement {
  @property({ attribute: false }) icons: (string | undefined)[] = [];

  render() {
    const length = this.icons.length;
    const iconsToShow = this.icons.slice(0, 4);
    const iconClass = length > 1 ? 'small' : '';
    const iconsHtml = iconsToShow.map((icon) => html` <ha-icon class=${iconClass} .icon=${icon}></ha-icon>`);
    if (length > 4) {
      iconsHtml.splice(3, 1, html`<span>+${length - 3}</span>`);
    }
    if (length > 2) {
      iconsHtml.splice(2, 0, html`<br />`);
    }
    return html` <div class="icons" ?empty=${length === 0}>${iconsHtml}</div>`;
  }

  static get styles() {
    return css`
      .icons {
        text-align: center;
        margin: 0;
        min-width: 5em;
        max-width: 5em;
      }

      .icons[empty] {
        min-width: 1em;
        max-width: 1em;
      }

      ha-icon {
        --mdc-icon-size: 3em;
        margin: 1em;
      }

      ha-icon.small {
        --mdc-icon-size: 2em;
        margin: 0;
      }
    `;
  }
}

customElements.define('sonos-group-icons', GroupIcons);
