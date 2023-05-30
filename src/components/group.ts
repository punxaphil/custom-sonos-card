import { HomeAssistant } from 'custom-card-helpers';
import { css, html, LitElement } from 'lit';
import { styleMap } from 'lit-html/directives/style-map.js';
import { property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import Store from '../store';
import { CardConfig, PlayerGroup, Section } from '../types';
import {
  dispatchActiveEntity,
  dispatchShowSection,
  getCurrentTrack,
  getSpeakerList,
  isPlaying,
  listenForEntityId,
  listenForPlayerRequest,
  stopListeningForEntityId,
  stopListeningForPlayerRequest,
} from '../utils';

class Group extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private group!: PlayerGroup;
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
      const entityId = this.group.entity;
      dispatchActiveEntity(entityId);
    }
  };

  render() {
    ({ config: this.config, hass: this.hass } = this.store);
    const currentTrack = this.config.hideGroupCurrentTrack ? '' : getCurrentTrack(this.hass.states[this.group.entity]);
    const speakerList = getSpeakerList(this.group);
    this.dispatchEntityIdEvent();
    const icon = this.hass.states[this.group.entity].attributes.icon;
    return html`
      <mwc-list-item
        hasMeta
        ?selected="${this.selected}"
        ?activated="${this.selected}"
        @click="${() => this.handleGroupClicked()}"
      >
        <div style=${wrapperStyle()}>
          <ha-icon .icon=${icon} style=${iconStyle()} ?hidden=${!icon}></ha-icon>
          <div style=${textStyle()}>
            <span style="${this.speakersStyle()}">${speakerList}</span>
            <span style="${this.songTitleStyle()}">${currentTrack}</span>
          </div>
        </div>

        ${when(
          isPlaying(this.group.state),
          () => html`
            <div style=${barsStyle()} slot="meta">
              <div style="${barStyle(1)}"></div>
              <div style="${barStyle(2)}"></div>
              <div style="${barStyle(3)}"></div>
            </div>
          `,
        )}
      </mwc-list-item>
    `;
  }

  private speakersStyle() {
    return styleMap({
      whiteSpace: 'initial',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: 'var(--secondary-text-color)',
    });
  }
  private songTitleStyle() {
    return styleMap({
      fontSize: '0.9rem',
      fontWeight: 'bold',
    });
  }

  private handleGroupClicked() {
    if (!this.selected) {
      this.selected = true;
      const newUrl = window.location.href.replace(/#.*/g, '');
      window.location.replace(`${newUrl}#${this.group.entity}`);
      this.dispatchEntityIdEvent();
      dispatchShowSection(Section.PLAYER);
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
      }
    `;
  }
}

function wrapperStyle() {
  return styleMap({ display: 'flex', margin: '1rem 0' });
}

function iconStyle() {
  return styleMap({ '--mdc-icon-size': '3rem', marginRight: '1rem' });
}
function textStyle() {
  return styleMap({ display: 'flex', flexDirection: 'column', justifyContent: 'center' });
}

function barsStyle() {
  return styleMap({ width: '0.55rem', position: 'relative', marginLeft: '1rem' });
}

function barStyle(order: number) {
  return styleMap({
    background: 'var(--secondary-text-color)',
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

customElements.define('sonos-group', Group);
