import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import Store from '../../model/store';
import { dispatchActivePlayerId, getSpeakerList } from '../../utils/utils';
import { SESSION_STORAGE_PLAYER_ID } from '../../constants';
import { MediaPlayer } from '../../model/media-player';
import '../../components/playing-bars';
import './group-icons';

class Group extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) player!: MediaPlayer;
  @property({ type: Boolean }) selected = false;

  dispatchEntityIdEvent = () => {
    if (this.selected) {
      dispatchActivePlayerId(this.player.id, this.store.config, this);
    }
  };

  render() {
    const { hideCurrentTrack, itemMargin, backgroundColor, speakersFontSize, titleFontSize, compact } = this.store.config.groups ?? {};
    const currentTrack = hideCurrentTrack ? '' : this.player.getCurrentTrack();
    const speakerList = getSpeakerList(this.player, this.store.predefinedGroups);
    const icons = this.player.members.map((member) => member.attributes.icon).filter((icon) => icon);
    const listItemStyle = styleMap({
      ...(itemMargin ? { margin: itemMargin } : {}),
      ...(backgroundColor ? { background: backgroundColor } : {}),
    });
    const speakersStyle = styleMap(speakersFontSize ? { fontSize: `${speakersFontSize}rem` } : {});
    const titleStyle = styleMap(titleFontSize ? { fontSize: `${titleFontSize}rem` } : {});
    return html`
      <mwc-list-item
        hasMeta
        class=${compact ? 'compact' : ''}
        ?selected=${this.selected}
        ?activated=${this.selected}
        @click=${() => this.handleGroupClicked()}
        style=${listItemStyle}
      >
        <div class="row">
          <sonos-group-icons .icons=${icons}></sonos-group-icons>
          <div class="text">
            <span class="speakers" style=${speakersStyle}>${speakerList}</span>
            <span class="song-title" style=${titleStyle}>${currentTrack}</span>
          </div>
        </div>

        <sonos-playing-bars slot="meta" .show=${this.player.isPlaying()}></sonos-playing-bars>
      </mwc-list-item>
    `;
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

      .compact ha-icon {
        --mdc-icon-size: 2em;
      }
      .compact div {
        margin: 0.1em;
      }
      sonos-playing-bars {
        margin-left: 0.5rem;
      }
    `;
  }
}

customElements.define('sonos-group', Group);
