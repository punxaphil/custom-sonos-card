import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import Store from '../model/store';
import { dispatchActivePlayerId, getSpeakerList } from '../utils/utils';
import { SESSION_STORAGE_PLAYER_ID } from '../constants';
import { MediaPlayer } from '../model/media-player';

class Group extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) player!: MediaPlayer;
  @property({ type: Boolean }) selected = false;

  dispatchEntityIdEvent = () => {
    if (this.selected) {
      const entityId = this.player.id;
      dispatchActivePlayerId(entityId, this.store.config, this);
    }
  };

  render() {
    const currentTrack = this.store.config.groupsHideCurrentTrack ? '' : this.player.getCurrentTrack();
    const speakerList = getSpeakerList(this.player, this.store.predefinedGroups);
    const icons = this.player.members.map((member) => member.attributes.icon).filter((icon) => icon);
    const itemMargin = this.store.config.groupsItemMargin;
    return html`
      <mwc-list-item
        hasMeta
        class=${this.store.config.compactGroups ? 'compact' : ''}
        ?selected=${this.selected}
        ?activated=${this.selected}
        @click=${() => this.handleGroupClicked()}
        style=${itemMargin ? `margin: ${itemMargin}` : nothing}
      >
        <div class="row">
          ${this.renderIcons(icons)}
          <div class="text">
            <span class="speakers">${speakerList}</span>
            <span class="song-title">${currentTrack}</span>
          </div>
        </div>

        ${when(
          this.player.isPlaying(),
          () => html`
            <div class="bars" slot="meta">
              <div></div>
              <div></div>
              <div></div>
            </div>
          `,
        )}
      </mwc-list-item>
    `;
  }

  private renderIcons(icons: (string | undefined)[]) {
    const length = icons.length;
    const iconsToShow = icons.slice(0, 4);
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

  connectedCallback() {
    super.connectedCallback();
    this.dispatchEntityIdEvent();
  }

  private handleGroupClicked() {
    if (!this.selected) {
      this.selected = true;
      if (!this.store.config.doNotRememberSelectedPlayer) {
        if (this.store.config.storePlayerInSessionStorage) {
          window.sessionStorage.setItem(SESSION_STORAGE_PLAYER_ID, this.player.id);
        } else {
          const newUrl = window.location.href.replace(/#.*/g, '');
          window.location.replace(`${newUrl}#${this.player.id}`);
        }
      }
      this.dispatchEntityIdEvent();
    }
  }

  static get styles() {
    return css`
      @keyframes sound {
        0% {
          opacity: 0.35;
          height: 0.15rem;
        }
        100% {
          opacity: 1;
          height: 1rem;
        }
      }

      mwc-list-item {
        height: fit-content;
        margin: 1rem;
        border-radius: 1rem;
        background: var(--secondary-background-color);
        padding-left: 0;
      }

      mwc-list-item.compact {
        margin: 0.3rem;
      }

      .row {
        display: flex;
        margin: 1rem 0;
        align-items: center;
      }

      .text {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .speakers {
        white-space: initial;
        font-size: 1.1rem;
        font-weight: bold;
        color: var(--secondary-text-color);
      }

      .song-title {
        font-size: 0.9rem;
        font-weight: bold;
      }

      .icons {
        text-align: center;
        margin: 0;
        min-width: 5rem;
        max-width: 5rem;
      }

      .icons[empty] {
        min-width: 1rem;
        max-width: 1rem;
      }

      ha-icon {
        --mdc-icon-size: 3rem;
        margin: 1rem;
      }

      ha-icon.small {
        --mdc-icon-size: 2rem;
        margin: 0;
      }

      .compact ha-icon {
        --mdc-icon-size: 2rem;
      }
      .compact div {
        margin: 0.1rem;
      }

      .bars {
        width: 0.55rem;
        position: relative;
        margin-left: 1rem;
      }

      .bars > div {
        background: var(--secondary-text-color);
        bottom: 0.05rem;
        height: 0.15rem;
        position: absolute;
        width: 0.15rem;
        animation: sound 0ms -800ms linear infinite alternate;
        display: block;
      }

      .bars > div:first-child {
        left: 0.05rem;
        animation-duration: 474ms;
      }

      .bars > div:nth-child(2) {
        left: 0.25rem;
        animation-duration: 433ms;
      }

      .bars > div:last-child {
        left: 0.45rem;
        animation-duration: 407ms;
      }
    `;
  }
}

customElements.define('sonos-group', Group);
