import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import '../components/player-controls';
import '../components/player-header';
import '../components/progress';
import '../components/volume';
import { listenForEntityId, sharedStyle, stopListeningForEntityId, stylable } from '../utils';

import { HassEntity } from 'home-assistant-js-websocket';
import Store from '../store';
import { CardConfig } from '../types';

export class Player extends LitElement {
  @property() store!: Store;
  private config!: CardConfig;
  private entityId!: string;
  private entity!: HassEntity;

  entityIdListener = (event: Event) => {
    const newEntityId = (event as CustomEvent).detail.entityId;
    if (newEntityId !== this.entityId) {
      this.entityId = newEntityId;
    }
  };

  connectedCallback() {
    super.connectedCallback();
    listenForEntityId(this.entityIdListener);
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
        <div style="${this.artworkStyle()}"></div>
        <dev-sonos-player-controls style="overflow-y:auto" .store=${this.store}></dev-sonos-player-controls>
      </div>
    `;
  }

  private bodyStyle() {
    return stylable('player-body', this.config, {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '100%',
    });
  }

  private artworkStyle() {
    const image = this.getArtworkImage();
    return stylable('player-artwork', this.config, {
      alignSelf: 'center',
      flexGrow: '1',
      flexShrink: '0',
      width: '100%',
      ...(image && {
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
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
      `,
      sharedStyle,
    ];
  }
}
