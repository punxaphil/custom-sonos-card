import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import Store from '../model/store';
import { dispatchActivePlayerId, getSpeakerList } from '../utils/utils';
import { SESSION_STORAGE_PLAYER_ID } from '../constants';
import { MediaPlayer } from '../model/media-player';
import './playing-bars';

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
    const groupsConfig = this.store.config.groups ?? {};
    const currentTrack = groupsConfig.hideCurrentTrack ? '' : this.player.getCurrentTrack();
    const speakerList = getSpeakerList(this.player, this.store.predefinedGroups);
    const icons = this.player.members.map((member) => member.attributes.icon).filter((icon) => icon);
    const { itemMargin, backgroundColor, speakersFontSize, titleFontSize } = groupsConfig;
    const listItemStyle = styleMap({
      ...(itemMargin ? { margin: itemMargin } : {}),
      ...(backgroundColor ? { background: backgroundColor } : {}),
    });
    const speakersStyle = styleMap(speakersFontSize ? { fontSize: `${speakersFontSize}rem` } : {});
    const titleStyle = styleMap(titleFontSize ? { fontSize: `${titleFontSize}rem` } : {});
    return html`
      <mwc-list-item
        hasMeta
        class=${groupsConfig.compact ? 'compact' : ''}
        ?selected=${this.selected}
        ?activated=${this.selected}
        @click=${() => this.handleGroupClicked()}
        style=${listItemStyle}
      >
        <div class="row">
          ${this.renderIcons(icons)}
          <div class="text">
            <span class="speakers" style=${speakersStyle}>${speakerList}</span>
            <span class="song-title" style=${titleStyle}>${currentTrack}</span>
          </div>
        </div>

        <sonos-playing-bars slot="meta" .show=${this.player.isPlaying()}></sonos-playing-bars>
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
        margin: 1em 0;
        align-items: center;
      }

      .text {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .speakers {
        white-space: initial;
        font-size: calc(var(--sonos-font-size, 1rem) * 1.1);
        font-weight: bold;
        color: var(--secondary-text-color);
      }

      .song-title {
        font-size: calc(var(--sonos-font-size, 1rem) * 0.9);
        font-weight: bold;
      }

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

      .compact ha-icon {
        --mdc-icon-size: 2em;
      }
      .compact div {
        margin: 0.1em;
      }
    `;
  }
}

customElements.define('sonos-group', Group);
