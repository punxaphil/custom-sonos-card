import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  listenForEntityId,
  noPlayerHtml,
  sharedStyle,
  stopListeningForEntityId,
  stylable,
  validateConfig,
  wrapInHaCardUnlessAllSectionsShown,
} from '../utils';
import '../components/progress';
import '../components/player-header';
import '../components/volume';
import '../components/media-controls';

import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED, CardConfig } from '../types';
import { StyleInfo } from 'lit-html/directives/style-map.js';
import { HassEntity } from 'home-assistant-js-websocket';
import { when } from 'lit/directives/when.js';
import { HomeAssistant } from 'custom-card-helpers';

export class Player extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  private entity!: HassEntity;
  @state() private entityId!: string;
  @state() showVolumes!: boolean;
  @state() showLoader!: boolean;
  @state() loaderTimestamp!: number;
  @state() cancelLoader!: boolean;

  entityIdListener = (event: Event) => {
    const newEntityId = (event as CustomEvent).detail.entityId;
    if (newEntityId !== this.entityId) {
      this.entityId = newEntityId;
      this.showVolumes = false;
    }
  };

  connectedCallback() {
    super.connectedCallback();
    listenForEntityId(this.entityIdListener);
    window.addEventListener(CALL_MEDIA_STARTED, () => {
      if (!this.showLoader) {
        this.cancelLoader = false;
        setTimeout(() => {
          if (!this.cancelLoader) {
            this.showLoader = true;
            this.loaderTimestamp = Date.now();
          }
        }, 300);
      }
    });
    window.addEventListener(CALL_MEDIA_DONE, () => {
      this.cancelLoader = true;
      const duration = Date.now() - this.loaderTimestamp;
      if (this.showLoader) {
        if (duration < 1000) {
          setTimeout(() => (this.showLoader = false), 1000 - duration);
        } else {
          this.showLoader = false;
        }
      }
    });
  }

  disconnectedCallback() {
    stopListeningForEntityId(this.entityIdListener);
    super.disconnectedCallback();
  }

  setConfig(config: CardConfig) {
    const parsed = JSON.parse(JSON.stringify(config));
    validateConfig(parsed);
    this.config = parsed;
  }

  render() {
    if (!this.entityId && this.config.entityId) {
      this.entityId = this.config.entityId;
    }
    if (this.entityId && this.hass) {
      this.entity = this.hass.states[this.entityId];

      const cardHtml = html`
        <div style="${this.containerStyle(this.entity)}">
          <div style="${this.bodyStyle()}">
            ${when(
              !this.showVolumes,
              () => html`<sonos-player-header
                .hass=${this.hass}
                .entity=${this.entity}
                .config=${this.config}
              ></sonos-player-header>`,
            )}
            <div class="loading" ?hidden="${!this.showLoader}">
              <ha-circular-progress active="" progress="0"></ha-circular-progress>
            </div>

            <sonos-media-controls
              .hass=${this.hass}
              .entity=${this.entity}
              .config=${this.config}
              .showVolumes=${this.showVolumes}
              @volumesToggled=${(e: Event) => (this.showVolumes = (e as CustomEvent).detail)}
            ></sonos-media-controls>
          </div>
        </div>
      `;
      return wrapInHaCardUnlessAllSectionsShown(cardHtml, this.config);
    }
    return noPlayerHtml;
  }

  private containerStyle(entity: HassEntity) {
    const prefix = this.config.artworkHostname || '';
    const entityImage = prefix + entity.attributes.entity_picture;
    const mediaTitle = entity.attributes.media_title;
    const mediaContentId = entity.attributes.media_content_id;
    let style: StyleInfo = {
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundImage: entityImage ? `url(${entityImage})` : '',
    };
    const overrides = this.config.mediaArtworkOverrides;
    if (overrides) {
      let override = overrides.find(
        (value) => mediaTitle === value.mediaTitleEquals || mediaContentId === value.mediaContentIdEquals,
      );
      if (!override) {
        override = overrides.find((value) => !entityImage && value.ifMissing);
      }
      if (override) {
        style = {
          ...style,
          backgroundImage: override.imageUrl ? `url(${override.imageUrl})` : style.backgroundImage,
          backgroundSize: override.sizePercentage ? `${override.sizePercentage}%` : style.backgroundSize,
        };
      }
    }
    return stylable('player-container', this.config, {
      marginTop: '1rem',
      position: 'relative',
      background: 'var(--sonos-int-background-color)',
      borderRadius: 'var(--sonos-int-border-radius)',
      paddingBottom: '100%',
      border: 'var(--sonos-int-border-width) solid var(--sonos-int-color)',
      ...style,
    });
  }

  private bodyStyle() {
    return stylable('player-body', this.config, {
      position: 'absolute',
      inset: '0px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: this.showVolumes ? 'flex-end' : 'space-between',
    });
  }

  static get styles() {
    return [
      css`
        .hoverable:focus,
        .hoverable:hover {
          color: var(--sonos-int-accent-color);
        }
        .hoverable:active {
          color: var(--primary-color);
        }
        .loading {
          text-align: center;
          --mdc-theme-primary: var(--sonos-int-accent-color);
        }
      `,
      sharedStyle,
    ];
  }
}
