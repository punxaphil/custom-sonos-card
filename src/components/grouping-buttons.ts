import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { PlayerGroups } from '../types';
import { getEntityName } from '../utils';
import { CustomSonosCard } from '../main';
import { styleMap } from 'lit-html/directives/style-map.js';

class GroupingButtons extends LitElement {
  @property() main!: CustomSonosCard;
  @property() groups!: PlayerGroups;
  @property() mediaPlayers!: string[];

  render() {
    const activePlayer = this.main.activePlayer;
    const joinedPlayers = this.mediaPlayers.filter(
      (player) => player !== activePlayer && this.groups[activePlayer].members[player],
    );
    const notJoinedPlayers = this.mediaPlayers.filter(
      (player) => player !== activePlayer && !this.groups[activePlayer].members[player],
    );
    return html`
      <div style="${this.membersStyle()}">
        ${activePlayer &&
        this.mediaPlayers.map((entity) => {
          const name = getEntityName(this.main.hass, this.main.config, entity);
          if (this.groups[activePlayer].members[entity] || (entity === activePlayer && joinedPlayers.length > 0)) {
            return this.getButton(() => this.main.mediaControlService.unjoin(entity), 'mdi:minus', name);
          } else if (entity !== activePlayer) {
            return this.getButton(() => this.main.mediaControlService.join(activePlayer, entity), 'mdi:plus', name);
          } else {
            return html``;
          }
        })}
        ${notJoinedPlayers.length
          ? this.getButton(
              () => this.main.mediaControlService.join(activePlayer, notJoinedPlayers.join(',')),
              'mdi:checkbox-multiple-marked-outline',
            )
          : ''}
        ${joinedPlayers.length
          ? this.getButton(
              () => this.main.mediaControlService.unjoin(joinedPlayers.join(',')),
              'mdi:minus-box-multiple-outline',
            )
          : ''}
      </div>
    `;
  }

  private getButton(click: () => void, icon: string, name?: string) {
    return html`
      <div @click="${click}" style="${this.memberStyle()}" class="hoverable">
        ${name ? html`<span style="${GroupingButtons.nameStyle()}">${name}</span>` : ''}
        <ha-icon .icon=${icon} style="${GroupingButtons.iconStyle()}"></ha-icon>
      </div>
    `;
  }

  private membersStyle() {
    return this.main.stylable('members', {
      padding: '0',
      margin: '0',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    });
  }

  private memberStyle() {
    return this.main.stylable('member', {
      flexGrow: '1',
      borderRadius: 'var(--sonos-int-border-radius)',
      margin: '0 0.25rem 0.5rem',
      padding: '0.45rem',
      display: 'flex',
      justifyContent: 'center',
      border: 'var(--sonos-int-border-width) solid var(--sonos-int-color)',
      backgroundColor: 'var(--sonos-int-background-color)',
      maxWidth: 'calc(100% - 1.4rem)',
    });
  }

  private static nameStyle() {
    return styleMap({
      alignSelf: 'center',
      fontSize: '1rem',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
  }

  private static iconStyle() {
    return styleMap({
      alignSelf: 'center',
      fontSize: '0.5rem',
    });
  }

  static get styles() {
    return css`
      .hoverable:hover,
      .hoverable:focus {
        color: var(--sonos-int-accent-color);
        border: var(--sonos-int-border-width) solid var(--sonos-int-accent-color);
      }
    `;
  }
}

customElements.define('sonos-grouping-buttons', GroupingButtons);
