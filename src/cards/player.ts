import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import '../components/player-controls';
import '../components/player-header';
import '../components/progress';
import '../components/volume';
import { listenForEntityId, sharedStyle, stopListeningForEntityId, stylable } from '../utils';

import { HassEntity } from 'home-assistant-js-websocket';
import Store from '../store';
import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED, CardConfig } from '../types';

export class Player extends LitElement {
  @property() store!: Store;
  private config!: CardConfig;
  private entityId!: string;
  private entity!: HassEntity;
  @state() showLoader!: boolean;
  @state() loaderTimestamp!: number;
  @state() cancelLoader!: boolean;

  entityIdListener = (event: Event) => {
    const newEntityId = (event as CustomEvent).detail.entityId;
    if (newEntityId !== this.entityId) {
      this.entityId = newEntityId;
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
      <div style="${this.bodyStyle()}">
        <dev-sonos-player-header .store=${this.store}></dev-sonos-player-header>
        <div class="loading" ?hidden="${!this.showLoader}">
          <ha-circular-progress active="" progress="0"></ha-circular-progress>
        </div>
        <div style="${this.artworkStyle()}"></div>
        <dev-sonos-player-controls style="overflow-y:auto" .store=${this.store}></dev-sonos-player-controls>
      </div>
    `;
  }

  private artworkStyle() {
    const size = '75%';
    const image = this.getArtworkImage();
    return stylable('player-artwork', this.config, {
      position: 'relative',
      width: size,
      alignSelf: 'center',
      paddingBottom: size,
      ...(image && {
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundImage: `url(${image})`,
      }),
    });
  }

  private getArtworkImage() {
    const prefix = this.config.artworkHostname || '';
    let entityImage = prefix + this.entity.attributes.entity_picture;
    const overrides = this.config.mediaArtworkOverrides;
    if (overrides) {
      const { media_title, media_content_id } = this.entity.attributes;
      let override = overrides.find(
        (value) => media_title === value.mediaTitleEquals || media_content_id === value.mediaContentIdEquals,
      );
      if (!override) {
        override = overrides.find((value) => !entityImage && value.ifMissing);
      }
      if (override?.imageUrl) {
        entityImage = override.imageUrl;
      }
    }
    return entityImage;
  }

  private bodyStyle() {
    return stylable('player-body', this.config, {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '100%',
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
