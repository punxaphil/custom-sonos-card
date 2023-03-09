import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import '../components/media-controls';
import '../components/player-header';
import '../components/progress';
import '../components/volume';
import { listenForEntityId, sharedStyle, stopListeningForEntityId, stylable } from '../utils';

import { HassEntity } from 'home-assistant-js-websocket';
import { StyleInfo } from 'lit-html/directives/style-map.js';
import { when } from 'lit/directives/when.js';
import Store from '../store';
import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED, CardConfig } from '../types';

export class Player extends LitElement {
  @property() store!: Store;
  private config!: CardConfig;
  private entityId!: string;
  private entity!: HassEntity;
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

  render() {
    ({ config: this.config, entity: this.entity, entityId: this.entityId } = this.store);
    return html`
      <div style="${this.containerStyle(this.entity)}">
        <div style="${this.bodyStyle()}">
          ${when(!this.showVolumes, () => html`<sonos-player-header .store=${this.store}></sonos-player-header>`)}
          <div class="loading" ?hidden="${!this.showLoader}">
            <ha-circular-progress active="" progress="0"></ha-circular-progress>
          </div>

          <sonos-media-controls
            .store=${this.store}
            .showVolumes=${this.showVolumes}
            @volumesToggled=${(e: Event) => (this.showVolumes = (e as CustomEvent).detail)}
          ></sonos-media-controls>
        </div>
      </div>
    `;
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
      position: 'relative',
      background: 'var(--sonos-int-background-color)',
      paddingBottom: '100%',
      borderRadius: '10px',
      overflow: 'hidden',
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
