import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import HassService from '../services/hass-service';
import MediaControlService from '../services/media-control-service';
import Store from '../store';
import { CardConfig, Members, Section, SHOW_SECTION } from '../types';
import { controlIcon, getGroupMembers, isPlaying, sharedStyle, stylable } from '../utils';

class MediaControls extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  @property()
  private entity!: HassEntity;

  private isGroup!: boolean;
  private entityId!: string;
  private mediaControlService!: MediaControlService;
  private hassService!: HassService;
  private members!: Members;
  @state() private timerToggleShowAllVolumes!: number;

  render() {
    ({
      config: this.config,
      hass: this.hass,
      entityId: this.entityId,
      entity: this.entity,
      mediaControlService: this.mediaControlService,
    } = this.store);
    this.members = this.store.groups[this.entityId].members;
    this.isGroup = getGroupMembers(this.entity).length > 1;
    const playing = !isPlaying(this.entity.state);

    // ${controlIcon('mdi:volume-minus', this.volDown)}
    // ${controlIcon(thithis.config,s.repeatIcon(), this.repeat)} ${until(this.getAdditionalSwitches())}
    // ${controlIcon(thithis.config,s.shuffleIcon(), this.shuffle)}
    // ${controlIcon('mdi:volume-plus', this.volUp)}

    return html`
      <div style="${this.mainStyle()}" id="mediaControls">
        <div style="${this.iconsStyle()}">
          ${controlIcon('mdi:skip-backward', this.prev)}
          ${playing ? controlIcon('mdi:play', this.play) : controlIcon('mdi:stop', this.pause)}
          ${controlIcon('mdi:skip-forward', this.next)}
        </div>
        <sonos-volume
          .store=${this.store}
          .entityId=${this.entityId}
          .members=${this.members}
          @volumeClicked=${() => this.isGroup && this.dispatchShowVolumes()}
        ></sonos-volume
        >;
      </div>
    `;
  }

  private volDown = async () => await this.mediaControlService.volumeDown(this.entityId, this.members);
  private prev = async () => await this.mediaControlService.prev(this.entityId);
  private play = async () => await this.mediaControlService.play(this.entityId);
  private pause = async () => await this.mediaControlService.pause(this.entityId);
  private next = async () => await this.mediaControlService.next(this.entityId);
  private shuffle = async () => await this.mediaControlService.shuffle(this.entityId, !this.entity?.attributes.shuffle);
  private repeat = async () => await this.mediaControlService.repeat(this.entityId, this.entity?.attributes.repeat);
  private volUp = async () => await this.mediaControlService.volumeUp(this.entityId, this.members);

  private shuffleIcon() {
    return this.entity?.attributes.shuffle ? 'mdi:shuffle-variant' : 'mdi:shuffle-disabled';
  }

  private repeatIcon() {
    const repeatState = this.entity?.attributes.repeat;
    return repeatState === 'all' ? 'mdi:repeat' : repeatState === 'one' ? 'mdi:repeat-once' : 'mdi:repeat-off';
  }

  private getAdditionalSwitches() {
    if (!this.config.skipAdditionalPlayerSwitches) {
      return this.hassService.getRelatedSwitchEntities(this.entityId).then((items: string[]) => {
        return items.map((item: string) => {
          return controlIcon(
            this.config,
            this.hass.states[item].attributes.icon || '',
            () => this.hassService.toggle(item),
            this.hass.states[item].state === 'on' ? { color: 'var(--sonos-int-accent-color)' } : {},
          );
        });
      });
    }
    return '';
  }

  private mainStyle() {
    return stylable('media-controls', this.config, {
      background: 'var(--sonos-int-player-section-background)',
      margin: '0.25rem',
      padding: '0.5rem',
      borderRadius: 'var(--sonos-int-border-radius)',
      overflow: 'hidden auto',
    });
  }

  private iconsStyle() {
    return stylable('media-controls-icons', this.config, {
      justifyContent: 'center',
      display: 'flex',
    });
  }

  static get styles() {
    return sharedStyle;
  }

  private dispatchShowVolumes() {
    window.dispatchEvent(new CustomEvent(SHOW_SECTION, { detail: Section.VOLUMES }));
  }
}

customElements.define('sonos-media-controls', MediaControls);
