import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { getEntityName } from '../utils';
import { CustomSonosCard } from '../main';
import { PlayerGroup } from '../types';
import { styleMap } from 'lit-html/directives/style-map.js';
import { when } from 'lit/directives/when.js';

class Group extends LitElement {
  @property() main!: CustomSonosCard;
  @property() activePlayer!: string;
  @property() group!: PlayerGroup;

  render() {
    const config = this.main.config;
    const stateObj = this.main.hass.states[this.group.entity];
    const currentTrack = `${stateObj.attributes.media_artist || ''} - ${stateObj.attributes.media_title || ''}`.replace(
      /^ - /g,
      '',
    );
    const speakerList = stateObj.attributes.sonos_group
      .map((speaker: string) => getEntityName(this.main.hass, config, speaker))
      .join(' + ');
    return html`
      <div @click="${() => this.handleGroupClicked()}" style="${this.groupStyle()}">
        <ul style="${this.speakersStyle()}">
          <span style="${this.speakerStyle()}">${speakerList}</span>
        </ul>
        <div style="${this.infoStyle()}">
          ${currentTrack
            ? html` <div style="flex: 1"><span style="${this.currentTrackStyle()}">${currentTrack}</span></div>
                ${when(
                  stateObj.state === 'playing',
                  () => html`
                    <div style="width: 0.55rem; position: relative;">
                      <div style="${Group.barStyle(1)}"></div>
                      <div style="${Group.barStyle(2)}"></div>
                      <div style="${Group.barStyle(3)}"></div>
                    </div>
                  `,
                )}`
            : ''}
        </div>
      </div>
    `;
  }

  private groupStyle() {
    const style = {
      borderRadius: 'var(--sonos-int-border-radius)',
      margin: '0.5rem 0',
      padding: '0.8rem',
      border: 'var(--sonos-int-border-width) solid var(--sonos-int-color)',
      backgroundColor: 'var(--sonos-int-background-color)',
      ...(this.activePlayer === this.group.entity && {
        border: 'var(--sonos-int-border-width) solid var(--sonos-int-accent-color)',
        color: 'var(--sonos-int-accent-color)',
        fontWeight: 'bold',
      }),
    };
    return this.main.stylable('group', style);
  }

  private speakersStyle() {
    return this.main.stylable('group-speakers', {
      margin: '0',
      padding: '0',
    });
  }

  private speakerStyle() {
    return this.main.stylable('group-speaker', {
      marginRight: '0.3rem',
      fontSize: '1rem',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
  }

  private infoStyle() {
    return this.main.stylable('group-info', {
      display: 'flex',
      flexDirection: 'row',
      clear: 'both',
    });
  }

  private currentTrackStyle() {
    return styleMap({
      display: this.main.config.hideGroupCurrentTrack ? 'none' : 'inline',
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
    this.main.setActivePlayer(this.group.entity);
    this.main.showVolumes = false;
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
    `;
  }
}

customElements.define('sonos-group', Group);
