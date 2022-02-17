import {css, html, LitElement} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class CustomSonosCard extends LitElement {

  static get properties() {
    return {
      hass: {},
      config: {},
      active: {},
      showVolumes: {}
    };
  }

  constructor() {
    super();
    this.favorites = [];
    this.timerToggleShowAllVolumes = '';
  }

  render() {
    this.selected_player = window.location.href.indexOf('#') > 0 ? window.location.href.replaceAll(/.*#/g, '') : '';
    if (this.active) {
      this.setActivePlayer(this.active);
    }
    const speakerNames = [];
    const zones = [];
    for (const entity of this.config.entities) {
      const stateObj = this.hass.states[entity];
      if (!stateObj) {
        console.error(entity, 'not found. Check your config. Ignoring and moving on to next entity (if any).');
        continue;
      }
      //Get favorites list
      if (!this.favorites.length) {
        for (const favorite of stateObj.attributes.source_list) {
          this.favorites.push(favorite);
        }
        if (this.config.shuffleFavorites) shuffleArray(this.favorites);
      }

      if (!(entity in zones)) {
        zones[entity] = {
          members: {},
          state: {},
          roomName: ""
        };
        speakerNames[entity] = stateObj.attributes.friendly_name;
        if (entity === this.selected_player) {
          this.setActivePlayer(entity);
        }
      }
      zones[entity].state = stateObj.state;
      zones[entity].roomName = stateObj.attributes.friendly_name;


      if (stateObj.attributes.sonos_group.length > 1 && stateObj.attributes.sonos_group[0] === entity) {

        for (const member of stateObj.attributes.sonos_group) {
          if (member !== entity) {
            const state = this.hass.states[member];
            zones[entity].members[member] = state.attributes.friendly_name;
            if (member === this.selected_player) {
              this.setActivePlayer(entity);
            }
          }
        }

        if (stateObj.state === 'playing' && !this.active) {
          this.setActivePlayer(entity);
        }
      } else if (stateObj.attributes.sonos_group.length > 1) {
        delete zones[entity];
      } else {
        if (stateObj.state === 'playing' && !this.active) {
          this.setActivePlayer(entity);
        }
      }
    }
    this.selected_player = null;
    if (!this.active) {
      this.setActivePlayer(Object.keys(zones)[0]);
    }

    const groupTemplates = [];
    let playerTemplate = html``;
    const favoriteTemplates = [];
    const memberTemplates = [];
    const joinedZones = []
    const notJoinedZones = []
    for (const key in zones) {
      let stateObj = this.hass.states[key];
      groupTemplates.push(html`
        <div class="group" @click="${() => {
          this.setActivePlayer(key);
          this.showVolumes = false;
        }}">
          <div class="wrap ${this.active === key ? 'active' : ''}">
            <ul class="speakers">
              ${stateObj.attributes.sonos_group.map(speaker => {
                return html`
                  <li>${speakerNames[speaker]}</li>`;
              })}
            </ul>
            <div class="play">
              <div class="content">
                <span
                    class="currentTrack">${stateObj.attributes.media_artist} - ${stateObj.attributes.media_title}</span>
              </div>
              <div class="player ${stateObj.state === 'playing' ? 'active' : ''}">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
              </div>
            </div>
          </div>
        </div>
      `);
    }
    if (groupTemplates.length !== this.groupSize) {
      this.groupButtonClicked = null;
    }
    this.groupSize = groupTemplates.length;

    if (this.active !== '') {
      const activeStateObj = this.hass.states[this.active];
      const isGroup = activeStateObj.attributes.sonos_group.length > 1;
      let allVolumes = [];
      if (isGroup) {
        allVolumes = activeStateObj.attributes.sonos_group.map(member => this.getVolumeTemplate(member, this.hass.states[member].attributes.friendly_name));
      }
      playerTemplate = html`
        <div class="player__container" style="background-position-x:center;background-repeat: no-repeat;background-size: cover;
              ${activeStateObj.attributes.entity_picture ? `background-image: url(${activeStateObj.attributes.entity_picture});` : ''}
              ">
          <div class="player__body">
            ${activeStateObj.attributes.media_title ? html`
              <div class="body__info">
                <div class="info__album">${activeStateObj.attributes.media_album_name}</div>
                <div class="info__song">${activeStateObj.attributes.media_title}</div>
                <div class="info__artist">${activeStateObj.attributes.media_artist}</div>
              </div>
              <div
                  class="${this.showVolumes ? 'hidden' : 'body__buttons ' + (activeStateObj.attributes.entity_picture ? 'padded__buttons' : '')}">
                <a class="list__link">
                  <ha-icon @click="${() => this.prev(this.active)}" .icon=${"mdi:skip-backward"}></ha-icon>
                </a>
                <a class="list__link">
                  ${activeStateObj.state !== 'playing' ? html`
                    <ha-icon @click="${() => this.play(this.active)}"
                             .icon=${"mdi:play"}></ha-icon>` : html`
                    <ha-icon @click="${() => this.pause(this.active)}" .icon=${"mdi:stop"}></ha-icon>
                  `}
                </a>
                <a class="list__link">
                  <ha-icon @click="${() => this.next(this.active)}" .icon=${"mdi:skip-forward"}></ha-icon>
                </a>
              </div>
            ` : html`
              <div style="width: 100%; text-align: center; padding: 3rem 0">
                ${this.config.noMediaText ? this.config.noMediaText : '🎺 What do you want to play? 🥁'}
              </div>`}
          </div>
          <div class="player__footer">
            ${this.getVolumeTemplate(this.active, this.showVolumes ? (this.config.allVolumesText ? this.config.allVolumesText : 'All') : '', zones[this.active].members)}
            <div style="display: ${this.showVolumes ? 'block' : 'none'}">
              ${allVolumes}
            </div>
            <div class="player__footer-icons">
              <ha-icon @click="${() => this.volumeDown(this.active, zones[this.active].members)}"
                       .icon=${"mdi:volume-minus"}></ha-icon>
              <ha-icon @click="${() => this.shuffle(this.active, !activeStateObj.attributes.shuffle)}"
                       .icon=${activeStateObj.attributes.shuffle ? 'mdi:shuffle-variant' : 'mdi:shuffle-disabled'}></ha-icon>
              <ha-icon style="display: ${isGroup ? 'block' : 'none'}"
                       @click="${() => this.toggleShowAllVolumes()}"
                       .icon=${this.showVolumes ? 'mdi:arrow-collapse-vertical' : 'mdi:arrow-expand-vertical'}></ha-icon>
              <ha-icon @click="${() => this.repeat(this.active, activeStateObj.attributes.repeat)}"
                       .icon=${activeStateObj.attributes.repeat === 'all' ? 'mdi:repeat' : activeStateObj.attributes.repeat === 'one' ? 'mdi:repeat-once' : 'mdi:repeat-off'}></ha-icon>
              <ha-icon @click="${() => this.volumeUp(this.active, zones[this.active].members)}"
                       .icon=${"mdi:volume-plus"}></ha-icon>
            </div>
          </div>
        </div>
      `;

      const spinner = html`
        <svg xmlns="http://www.w3.org/2000/svg"
             style="margin: 0;display: block;float: left;"
             width="20px" height="20px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
          <g transform="rotate(0 50 50)">
            <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="gray">
              <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.9166666666666666s"
                       repeatCount="indefinite"></animate>
            </rect>
          </g>
          <g transform="rotate(30 50 50)">
            <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="gray">
              <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.8333333333333334s"
                       repeatCount="indefinite"></animate>
            </rect>
          </g>
          <g transform="rotate(60 50 50)">
            <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="gray">
              <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.75s"
                       repeatCount="indefinite"></animate>
            </rect>
          </g>
          <g transform="rotate(90 50 50)">
            <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="gray">
              <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.6666666666666666s"
                       repeatCount="indefinite"></animate>
            </rect>
          </g>
          <g transform="rotate(120 50 50)">
            <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="gray">
              <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.5833333333333334s"
                       repeatCount="indefinite"></animate>
            </rect>
          </g>
          <g transform="rotate(150 50 50)">
            <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="gray">
              <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.5s"
                       repeatCount="indefinite"></animate>
            </rect>
          </g>
          <g transform="rotate(180 50 50)">
            <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="gray">
              <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.4166666666666667s"
                       repeatCount="indefinite"></animate>
            </rect>
          </g>
          <g transform="rotate(210 50 50)">
            <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="gray">
              <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.3333333333333333s"
                       repeatCount="indefinite"></animate>
            </rect>
          </g>
          <g transform="rotate(240 50 50)">
            <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="gray">
              <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.25s"
                       repeatCount="indefinite"></animate>
            </rect>
          </g>
          <g transform="rotate(270 50 50)">
            <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="gray">
              <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s"
                       begin="-0.16666666666666666s" repeatCount="indefinite"></animate>
            </rect>
          </g>
          <g transform="rotate(300 50 50)">
            <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="gray">
              <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s"
                       begin="-0.08333333333333333s" repeatCount="indefinite"></animate>
            </rect>
          </g>
          <g transform="rotate(330 50 50)">
            <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="gray">
              <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="0s"
                       repeatCount="indefinite"></animate>
            </rect>
          </g>
        </svg>
      `;
      for (const member in zones[this.active].members) {
        joinedZones.push(member);
        memberTemplates.push(html`
          <div class="member" @click="${() => this.callSonosService('unjoin', {entity_id: member})}">
            <span>${zones[this.active].members[member]} </span>
            ${this.groupButtonClicked === member ? spinner : html`
              <ha-icon .icon=${"mdi:minus"}></ha-icon>
            `}
          </div>
        `);
      }
      for (const zonesKey in zones) {
        if (zonesKey !== this.active) {
          notJoinedZones.push(zonesKey);
          memberTemplates.push(html`
            <div class="member" @click="${() => this.sonosJoin(zonesKey)}">
              <span>${zones[zonesKey].roomName} </span>
              ${this.groupButtonClicked === zonesKey ? spinner : html`
                <ha-icon .icon=${"mdi:plus"}></ha-icon>
              `}
            </div>
          `);
        }
      }

      for (const favorite of this.favorites) {
        favoriteTemplates.push(html`
          <div class="favorite" @click="${() => this.callMediaService('select_source', {
            source: favorite,
            entity_id: this.active
          })}"><span>${favorite}</span>
            <ha-icon .icon=${"mdi:play"}></ha-icon>
          </div>
        `);
      }
    }


    return html`
      ${this.config.name ? html`
        <div class="header">
          <div class="name">${this.config.name}</div>
        </div>
      ` : ''}
      <div class="center">
        <div class="groups">
          <div class="title">${this.config.groupsTitle ? this.config.groupsTitle : 'Groups'}</div>
          ${groupTemplates}
        </div>

        <div class="players">
          ${playerTemplate}
          <div class="title">${this.config.groupingTitle ? this.config.groupingTitle : 'Grouping'}</div>
          <div class="members">
            ${memberTemplates}
          </div>
          <div class="members">
            <div class="member join-all" @click="${() => this.callSonosService('join', {
              master: this.active,
              entity_id: notJoinedZones.join(',')
            })}">
              <ha-icon .icon=${"mdi:checkbox-multiple-marked-outline"}></ha-icon>
            </div>
            <div class="member unjoin-all"
                 @click="${() => this.callSonosService('unjoin', {entity_id: joinedZones.join(',')})}">
              <ha-icon .icon=${"mdi:minus-box-multiple-outline"}></ha-icon>
            </div>
          </div>
        </div>

        <div class="sidebar">
          <div class="title">${this.config.favoritesTitle ? this.config.favoritesTitle : 'Favorites'}</div>
          <div class="favorites">
            ${favoriteTemplates}
          </div>
        </div>
      </div>
    `;
  }

  sonosJoin(zonesKey) {
    this.callSonosService('join', {
      master: this.active,
      entity_id: zonesKey
    })
    this.groupButtonClicked = zonesKey;
  }

  callSonosService(service, inOptions) {
    this.hass.callService('sonos', service, inOptions);
  }

  callMediaService(service, inOptions) {
    this.hass.callService('media_player', service, inOptions);
  }


  getVolumeTemplate(entity, name, members = {}) {
    const volume = 100 * this.hass.states[entity].attributes.volume_level;
    let max = 100;
    let inputColor = 'rgb(211, 3, 32)';
    if (volume < 20) {
      max = 30;
      inputColor = 'rgb(72,187,14)';
    }
    return html`
      ${name ? html`
        <div style="margin-top: 1rem; margin-left: 0.4rem;">${name}</div>` : ''}
      <div style="font-size: x-small; margin: 0 0.4rem; display: flex;">
        <div style="flex: ${volume}">0%</div>
        <div style="flex: 2">${Math.round(volume)}%</div>
        <div style="flex: ${max - volume};text-align: right">${max}%</div>
      </div>
      <input type="range" .value="${volume}"
             @change=${e => this.volumeSet(entity, members, e.target.value)}
             min="0" max="${max}" id="volumeRange" class="volumeRange"
             style="background: linear-gradient(to right, ${inputColor} 0%, ${inputColor} ${volume * 100 / max}%, rgb(211, 211, 211) ${volume * 100 / max}%, rgb(211, 211, 211) 100%);">
    `;
  }


  pause(entity) {
    this.callMediaService('media_pause', {
      entity_id: entity
    });
  }

  prev(entity) {
    this.callMediaService('media_previous_track', {
      entity_id: entity
    });
  }

  next(entity) {
    this.callMediaService('media_next_track', {
      entity_id: entity
    });
  }

  play(entity) {
    this.callMediaService('media_play', {
      entity_id: entity
    });
  }

  shuffle(entity, state) {
    this.callMediaService('shuffle_set', {
      entity_id: entity,
      shuffle: state
    });
  }

  repeat(entity, currentState) {
    const state = currentState === 'all' ? 'one' : currentState === 'one' ? 'off' : 'all';
    this.callMediaService('repeat_set', {
      entity_id: entity,
      repeat: state
    });
  }

  volumeDown(entity, members) {
    this.callMediaService('volume_down', {
      entity_id: entity
    });


    for (const member in members) {
      this.callMediaService('volume_down', {
        entity_id: member
      });
    }

  }

  volumeUp(entity, members) {
    this.callMediaService('volume_up', {
      entity_id: entity
    });

    for (const member in members) {
      this.callMediaService('volume_up', {
        entity_id: member
      });
    }
  }

  volumeSet(entity, members, volume) {
    const volumeFloat = volume / 100;

    this.callMediaService('volume_set', {
      entity_id: entity,
      volume_level: volumeFloat
    });

    for (const member in members) {
      this.callMediaService('volume_set', {
        entity_id: member,
        volume_level: volumeFloat
      });
    }
  }


  setConfig(config) {
    if (!config.entities) {
      throw new Error("You need to define entities");
    }
    this.config = config;
  }

  getCardSize() {
    return this.config.entities.length + 1;
  }

  toggleShowAllVolumes() {
    this.showVolumes = !this.showVolumes;
    clearTimeout(this.timerToggleShowAllVolumes);
    if (this.showVolumes) {
      this.timerToggleShowAllVolumes = setTimeout(() => {
        this.showVolumes = false;
        window.scrollTo(0, 0);
      }, 30000);
    }
  }

  static get styles() {
    return css`
      ha-card {
        background: var(
          --ha-card-background,
          var(--paper-card-background-color, white)
        );
        border-radius: var(--ha-card-border-radius, 2px);
        box-shadow: var(
          --ha-card-box-shadow,
          0 2px 2px 0 rgba(0, 0, 0, 0.14),
          0 1px 5px 0 rgba(0, 0, 0, 0.12),
          0 3px 1px -2px rgba(0, 0, 0, 0.2)
        );
        color: var(--primary-text-color);
        display: block;
        transition: all 0.3s ease-out;
        padding: 16px;
      }
      .header {
        color: var(--ha-card-header-color, --primary-text-color);
        font-family: var(--ha-card-header-font-family, inherit);
        font-size: var(--ha-card-header-font-size, 24px);
        letter-spacing: -0.012em;
        line-height: 32px;
        padding: 4px 0 12px;
        display: block;
      }
      .header .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .players {
        flex: 3;
      }
      .player__container {
        position: relative;
        overflow: hidden;
        z-index: 0;
        margin:0;
        background: var(
          --ha-card-background,
          var(--paper-card-background-color, white)
        );
        border-radius: 0.25rem;
        border: 8px solid var(
          --ha-card-background,
          var(--paper-card-background-color, white)
        ); 
        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.19), 0 6px 6px -10px rgba(0, 0, 0, 0.23);
      }
      
      .player__body {
        background-repeat: no-repeat;
        background-size: 10%;
        background-position-y: center;
      }

      .player__footer {
        background: #ffffffe6;
        margin: 1rem;
        border-radius: 0.25rem;
      }
      .player__footer input {
        width: 97%;
      }
      
      .player__footer-icons {
        justify-content: space-between;
        display: flex;
      }
      .player__footer div ha-icon {
        color: #888;
        padding: 10px;
      }

      .volumeRange {
        -webkit-appearance: none;
        height: 5px;
        border-radius: 5px;
        background: #d3d3d3;
        outline: none;
        opacity: 0.7;
        -webkit-transition: .2s;
        transition: opacity .2s;
        margin: 6px 5px 0 5px;
      }



      .list--cover {
        justify-content: flex-end;
      }

      .list--header .list__link,
      .list__link {
        color: #888;
      }

      .list--cover {
        position: absolute;
        top: .5rem;
        width: 100%;
      }
      .list--cover li:first-of-type {
        margin-left: .75rem;
      }
      .list--cover li:last-of-type {
        margin-right: .75rem;
      }
      .list--cover a {
        font-size: 1.15rem;
        color: #fff;
      }

      .range {
        position: relative;
        top: -1.5rem;
        right: 0;
        left: 0;
        margin: auto;
        background: rgba(255, 255, 255, 0.95);
        width: 80%;
        height: 0.125rem;
        border-radius: 0.25rem;
        cursor: pointer;
      }
      .range:before, .range:after {
        content: "";
        position: absolute;
        cursor: pointer;
      }
      .range:before {
        width: 3rem;
        height: 100%;
        background: -webkit-linear-gradient(left, rgba(211, 3, 32, 0.5), rgba(211, 3, 32, 0.85));
        background: linear-gradient(to right, rgba(211, 3, 32, 0.5), rgba(211, 3, 32, 0.85));
        border-radius: 0.25rem;
        overflow: hidden;
      }
      .range:after {
        top: -0.375rem;
        left: 3rem;
        z-index: 3;
        width: 0.875rem;
        height: 0.875rem;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 3px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.15);
        -webkit-transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
        transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
      }
      .range:focus:after, .range:hover:after {
        background: rgba(211, 3, 32, 0.95);
      }

      .body__info {
        margin: 1rem;
        text-align: center;
        background: #ffffffe6;
        border-radius: 0.25rem;
      }

      .info__album,
      .info__song {
        margin-bottom: .5rem;
        white-space: wrap;
      }

      .info__artist,
      .info__album {
        font-size: .75rem;
        font-weight: 300;
        color: #666;
      }
      
      .info__artist {
        white-space: wrap;
      }

      .info__song {
        font-size: 1.15rem;
        font-weight: 400;
        color: #d30320;
      }

      .info__artwork {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        z-index: -2;
      }
      .padded__buttons {
        padding: 8rem;
      }

      .body__buttons {
        display: flex;
        justify-content: center;
      }

      .body__buttons a {
        padding: 0.8rem;
        box-shadow: 0 3px 6px rgba(33, 33, 33, 0.1), 0 3px 12px rgba(33, 33, 33, 0.15);
      }
      .body__buttons a:focus, .body__buttons a:hover {
        color: rgba(171, 2, 26, 0.95);
        opacity: 1;
        box-shadow: 0 6px 9px rgba(33, 33, 33, 0.1), 0 6px 16px rgba(33, 33, 33, 0.15);
      }

      .body__buttons li:first-of-type a,
      .body__buttons li:last-of-type a {
        font-size: .95rem;
        color: #212121;
        opacity: .5;
      }
      .body__buttons li:first-of-type a:focus, .body__buttons li:first-of-type a:hover,
      .body__buttons li:last-of-type a:focus,
      .body__buttons li:last-of-type a:hover {
        color: #d30320;
        opacity: .75;
      }

      .list__link {
        -webkit-transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
        transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
        margin: 1rem;
        border-radius: 50%;
        background: #ffffffe6;
      }
      .list__link:focus, .list__link:hover {
        color: #d30320;
      }

      .center {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: center;
      }

      .groups {
        margin: 0 20px 0 20px;
        padding: 0;
        flex: 2; 
      }
      .group {
        padding:0;
        margin:0;
      }
      .group .wrap {
        border-radius:4px;
        margin:2px;
        padding:9px;
        background-color: var(
          --ha-card-background,
          var(--paper-card-background-color, white)
        );
      }
      .group .wrap.active {
        margin:5px 0;
        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.19), 0 6px 6px -10px rgba(0, 0, 0, 0.23);
        border-color: #d30320;
        border-width: thin;
        border-style: solid;
        font-weight: bold;
      }
      .group:first-child .wrap {
        margin-top:0;
      }
      .speakers {
        list-style:none;
        margin:0;
        padding:0;
      }
      .speakers li {
        display:block;
        font-size:12px;
        margin:5px 0 0 0 ;
        color:#000;
      }
      .speakers li:first-child {
        margin:0;
      }
      .group .play {
        display:flex;
        flex-direction:row;
        margin-top:10px;
      }
      .group .play .content {
        flex:1;
      }
      .group .play .content .source {
        display:block;
        color:#CCC;
        font-size:10px;
      }
      .group .play .content .currentTrack {
        display:block;
        font-size:12px;
      }
      .group .play .player {
        width:12px;
        position:relative;
      }
      .group .play .player .bar {
        background: #666;
        bottom: 1px;
        height: 3px;
        position: absolute;
        width: 3px;
        animation: sound 0ms -800ms linear infinite alternate;
        display:none;
      }
      .group .play .player.active .bar{
        display:block;
      }
      .group .play .player .bar:nth-child(1) {
        left: 1px;
        animation-duration: 474ms;
      }
      .group .play .player .bar:nth-child(2) {
        left: 5px;
        animation-duration: 433ms;
      }
      .group .play .player .bar:nth-child(3) {
        left: 9px;
        animation-duration: 407ms;
      }

      .sidebar {
        margin:0 20px 0 20px;
        padding:0;
        flex: 2;
      }
      .title {
        margin-top: 10px;
        text-align: center;
        color: var(
          --ha-card-background,
          var(--paper-card-background-color, white)
        );
        font-weight: bold;
        font-size: larger;
      }
      .members {
        padding:0;
        margin:0;
        display: flex;
        flex-direction:row;
        flex-wrap: wrap;
        justify-content: space-between;
      }
      .member {
        flex-grow: 1;
        border-radius:4px;
        margin:2px;
        padding:9px;
        display: flex;
        justify-content: center;
        background-color: var(
          --ha-card-background,
          var(--paper-card-background-color, white)
        );
        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.19), 0 6px 6px -10px rgba(0, 0, 0, 0.23);
      }
      .member span {
        align-self:center;
        font-size:12px;
        color:#000;
      }
      .member ha-icon {
        align-self:center;
        font-size:10px;
        color: #888;
      }
      .member:hover ha-icon {
        color: #d30320;
      }

      .favorites {
        padding:0;
        margin:0 0 30px 0;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
      }
      .favorite {
        flex-grow: 1;
        border-radius:4px;
        margin:2px;
        padding:9px;
        display: flex;
        justify-content: center;
        background-color: var(
          --ha-card-background,
          var(--paper-card-background-color, white)
        );
        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.19), 0 6px 6px -10px rgba(0, 0, 0, 0.23);
      }
      .favorite span {
        font-size:12px;
        color:#000;
      }
      .favorite ha-icon {
        font-size:10px;
        color: #888;
      }
      .favorite:hover ha-icon {
        color: #d30320;
      }
      
      .hidden {
        display: none;
      }

      @keyframes sound {
        0% {
          opacity: .35;
          height: 3px;
        }
        100% {
          opacity: 1;
          height: 20px;
        }
      }
      
      @media (max-width: 650px) {
          .center {
            flex-wrap: wrap;
          }
          .players {
            order: 0;
          }   
          .groups {
            order: 1;
          }   
          .sidebar {
            order: 2;
          } 
      } 
    `;
  }

  setActivePlayer(entity) {
    this.active = entity;
    let newUrl = window.location.href.replaceAll(/#.*/g, '');
    window.location.href = newUrl + '#' + entity;
  }

}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

customElements.define('custom-sonos-card', CustomSonosCard);
