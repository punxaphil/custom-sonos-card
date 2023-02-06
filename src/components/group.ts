import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import {
  getCurrentTrack,
  isPlaying,
  listenForEntityId,
  listenForPlayerRequest,
  stopListeningForEntityId,
  stopListeningForPlayerRequest,
  stylable,
} from '../utils';
import { ACTIVE_PLAYER_EVENT, CardConfig, PlayerGroup } from '../types';
import { styleMap } from 'lit-html/directives/style-map.js';
import { when } from 'lit/directives/when.js';
import { HomeAssistant } from 'custom-card-helpers';

class Group extends LitElement {
  @property() hass!: HomeAssistant;
  @property() config!: CardConfig;
  @property() group!: PlayerGroup;
  @property() selected = false;

  connectedCallback() {
    super.connectedCallback();
    listenForEntityId(this.entityIdListener);
    listenForPlayerRequest(this.dispatchEntityIdEvent);
  }

  disconnectedCallback() {
    stopListeningForEntityId(this.entityIdListener);
    stopListeningForPlayerRequest(this.dispatchEntityIdEvent);
    super.disconnectedCallback();
  }

  entityIdListener = (event: Event) => {
    this.selected = (event as CustomEvent).detail.entityId === this.group?.entity;
  };

  dispatchEntityIdEvent = () => {
    if (this.selected) {
      const event = new CustomEvent(ACTIVE_PLAYER_EVENT, {
        bubbles: true,
        composed: true,
        detail: { entityId: this.group.entity },
      });
      window.dispatchEvent(event);
    }
  };

  render() {
    const currentTrack = getCurrentTrack(this.hass.states[this.group.entity]);
    const speakerList = [this.group.roomName, ...Object.values(this.group.members)].join(' + ');
    this.dispatchEntityIdEvent();
    return html`
      <mwc-list-item
        twoline
        hasMeta
        divider
        ?selected="${this.selected}"
        ?activated="${this.selected}"
        @click="${() => this.handleGroupClicked()}"
        style="${this.groupStyle()}"
      >
        <span style="white-space: initial" style="${this.speakersStyle()}">${speakerList}</span>
        <span slot="secondary">${currentTrack}</span>

        ${when(
          isPlaying(this.group.state),
          () => html`
            <div style="width: 0.55rem; position: relative;" slot="meta">
              <div style="${Group.barStyle(1)}"></div>
              <div style="${Group.barStyle(2)}"></div>
              <div style="${Group.barStyle(3)}"></div>
            </div>
          `,
        )}
      </mwc-list-item>
    `;
  }

  private groupStyle() {
    return stylable('group', this.config);
  }

  private speakersStyle() {
    return stylable('group-speakers', this.config);
  }

  private speakerStyle() {
    return stylable('group-speaker', this.config, {
      marginRight: '0.3rem',
      fontSize: '1rem',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
  }

  private infoStyle() {
    return stylable('group-info', this.config, {
      display: 'flex',
      flexDirection: 'row',
      clear: 'both',
    });
  }

  private currentTrackStyle() {
    return styleMap({
      display: this.config.hideGroupCurrentTrack ? 'none' : 'inline',
      fontSize: '0.8rem',
    });
  }

  private static barStyle(order: number) {
    return styleMap({
      background: 'var(--sonos-int-color)',
      bottom: '0.05rem',
      height: '0.15rem',
      position: 'absolute',
      width: '0.15rem',
      animation: 'sound 0ms -800ms linear infinite alternate',
      display: 'block',
      left: order == 1 ? '0.05rem' : order == 2 ? '0.25rem' : '0.45rem',
      animationDuration: order == 1 ? '474ms' : order == 2 ? '433ms' : '407ms',
    });
  }

  private handleGroupClicked() {
    if (!this.selected) {
      this.selected = true;
      const newUrl = window.location.href.replace(/#.*/g, '');
      window.location.replace(`${newUrl}#${this.group.entity}`);
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
        padding-bottom: 1rem;
        padding-top: 0;
      }
    `;
  }
}

customElements.define('sonos-group', Group);
