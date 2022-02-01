import {
  LitElement,
  html,
  css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class CustomSonosCard extends LitElement {

  static get properties() {
    return {
      hass: {},
      config: {},
      active: {}
    };
  }

  constructor() {
    super();
    this.active = '';
  }

  render() {
    const speakerNames = [];
    const zones = [];
    const favorites = [];
    let first = true;
    for (let entity of this.config.entities) {
      const stateObj = this.hass.states[entity];
      //Get favorites list
      if (first) {
        first = false;
        for (let favorite of stateObj.attributes.source_list) {
          favorites.push(favorite);
        }
      }

      if (!(entity in zones)) {
        zones[entity] = {
          members: {},
          state: {},
          roomName: ""
        };
        speakerNames[entity] = stateObj.attributes.friendly_name;
      }
      zones[entity].state = stateObj.state;
      zones[entity].roomName = stateObj.attributes.friendly_name;


      if (stateObj.attributes.sonos_group.length > 1 && stateObj.attributes.sonos_group[0] === entity) {

        for (let member of stateObj.attributes.sonos_group) {
          const state = this.hass.states[member];
          zones[entity].members[member] = state.attributes.friendly_name;
        }

        if (stateObj.state === 'playing' && this.active === '') {
          this.active = entity;
        }
      } else if (stateObj.attributes.sonos_group.length > 1) {
        delete zones[entity];
      } else {
        if (stateObj.state === 'playing' && this.active === '') {
          this.active = entity;
        }
      }
    }
    if (!this.active) {
      this.active = Object.keys(zones)[0];
    }
    const groupTemplates = [];
    let playerTemplate = html``;
    const favoriteTemplates = [];
    const memberTemplates = [];
    for (let key in zones) {
      let stateObj = this.hass.states[key];
      groupTemplates.push(html`
          <div class="group" data-id="${key}">
              <div class="wrap ${this.active === key ? 'active' : ''}">
                  <ul class="speakers">
                      ${stateObj.attributes.sonos_group.map(speaker => {
                          return html`
                              <li>${speakerNames[speaker]}</li>`;
                      })}
                  </ul>
                  <div class="play">
                      <div class="content">
                          <span class="currentTrack">${stateObj.attributes.media_artist} - ${stateObj.attributes.media_title}</span>
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
      const volume = 100 * activeStateObj.attributes.volume_level;

      playerTemplate = html`
          <div class="player__container">
              ${activeStateObj.attributes.entity_picture ? html`
                  <img src="${activeStateObj.attributes.entity_picture}" width="100%" alt="Sonos"/>
              ` : ''}
              <div class="player__body">
                  <div class="body__cover">
                  </div>
                  <div class="body__info">
                      <div class="info__album">${activeStateObj.attributes.media_album_name}</div>
                      <div class="info__song">${activeStateObj.attributes.media_title}</div>
                      <div class="info__artist">${activeStateObj.attributes.media_artist}</div>
                  </div>
                  <div class="body__buttons list--buttons">
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
              </div>
              <div class="player__footer">
                  <ul class="list list--footer">
                      <li>
                          <ha-icon @click="${() => this.volumeDown(this.active, zones[this.active].members)}"
                                   .icon=${"mdi:volume-minus"}></ha-icon>
                          <input type="range" .value="${volume}"
                                 @change=${e => this.volumeSet(this.active, zones[this.active].members, e.target.value)}
                                 min="0" max="100" id="volumeRange" class="volumeRange"
                                 style="background: linear-gradient(to right, rgb(211, 3, 32) 0%, rgb(211, 3, 32) ${volume}%, rgb(211, 211, 211) ${volume}%, rgb(211, 211, 211) 100%);">
                          <ha-icon @click="${() => this.volumeUp(this.active, zones[this.active].members)}"
                                   .icon=${"mdi:volume-plus"}></ha-icon>
                      </li>
                  </ul>
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
      for (let member in zones[this.active].members) {
        memberTemplates.push(html`
            <li>
                <div class="member unjoin-member" data-member="${member}">
                    <span>${zones[this.active].members[member]} </span>
                    ${this.groupButtonClicked === member ? spinner : html`
                        <ha-icon .icon=${"mdi:minus"}></ha-icon>
                    `}
                    </i>
                </div>
            </li>
        `);
      }
      for (let zonesKey in zones) {
        if (zonesKey !== this.active) {
          memberTemplates.push(html`
              <li>
                  <div class="member join-member" data-member="${zonesKey}">
                      <span>${zones[zonesKey].roomName} </span>
                      ${this.groupButtonClicked === zonesKey ? spinner : html`
                          <ha-icon .icon=${"mdi:plus"}></ha-icon>
                      `}
                      </i>
                  </div>
              </li>
          `);
        }
      }


      for (let favorite of favorites) {
        favoriteTemplates.push(html`
            <li>
                <div class="favorite" data-favorite="${favorite}"><span>${favorite}</span>
                    <ha-icon .icon=${"mdi:play"}></ha-icon>
                </div>
            </li>
        `);
      }
    }


    return html`
        <div class="header">
            <div class="name">${this.config.name}</div>
        </div>

        <div class="center">
            <div class="groups">
                <div class="title">${this.config.groupsTitle ? this.config.groupsTitle : 'Groups'}</div>
                ${groupTemplates}
            </div>

            <div class="players">
                ${playerTemplate}
                <div class="title">${this.config.groupingTitle ? this.config.groupingTitle : 'Grouping'}</div>
                <ul class="members">
                    ${memberTemplates}
                </ul>
            </div>

            <div class="sidebar">
                <div class="title">${this.config.favoritesTitle ? this.config.favoritesTitle : 'Favorites'}</div>
                <ul class="favorites">
                    ${favoriteTemplates}
                </ul>
            </div>
        </div>
    `;
  }

  updated() {
    //Set active player
    this.shadowRoot.querySelectorAll(".group").forEach(group => {
      group.addEventListener('click', () => {
        this.active = group.dataset.id;
      })
    });
    //Set favorite as Source
    this.shadowRoot.querySelectorAll(".favorite").forEach(favorite => {
      favorite.addEventListener('click', () => {
        this.hass.callService("media_player", "select_source", {
          source: favorite.dataset.favorite,
          entity_id: this.active
        });
      })
    });
    //Join player
    this.shadowRoot.querySelectorAll(".join-member").forEach(member => {
      member.addEventListener('click', () => {
        this.hass.callService("sonos", "join", {
          master: this.active,
          entity_id: member.dataset.member
        });
        this.groupButtonClicked = member.dataset.member;
      })
    });
    //Unjoin player
    this.shadowRoot.querySelectorAll(".unjoin-member").forEach(member => {
      member.addEventListener('click', () => {
        this.hass.callService("sonos", "unjoin", {
          entity_id: member.dataset.member
        });
      })
    });
  }


  pause(entity) {
    this.hass.callService("media_player", "media_pause", {
      entity_id: entity
    });
  }

  prev(entity) {
    this.hass.callService("media_player", "media_previous_track", {
      entity_id: entity
    });
  }

  next(entity) {
    this.hass.callService("media_player", "media_next_track", {
      entity_id: entity
    });
  }

  play(entity) {
    this.hass.callService("media_player", "media_play", {
      entity_id: entity
    });
  }

  volumeDown(entity, members) {
    this.hass.callService("media_player", "volume_down", {
      entity_id: entity
    });


    for (let member in members) {
      this.hass.callService("media_player", "volume_down", {
        entity_id: member
      });
    }

  }

  volumeUp(entity, members) {
    this.hass.callService("media_player", "volume_up", {
      entity_id: entity
    });

    for (var member in members) {
      this.hass.callService("media_player", "volume_up", {
        entity_id: member
      });
    }
  }

  volumeSet(entity, members, volume) {
    const volumeFloat = volume / 100;

    this.hass.callService("media_player", "volume_set", {
      entity_id: entity,
      volume_level: volumeFloat
    });

    for (let member in members) {
      this.hass.callService("media_player", "volume_set", {
        entity_id: member,
        volume_level: volumeFloat
      });
    }
  }


  setConfig(config) {
    if (!config.entities) {
      throw new Error("You need to define entities");
    }
    if (!config.name) {
      throw new Error("You need to define a name for the cards header");
    }
    this.config = config;
  }

  getCardSize() {
    return this.config.entities.length + 1;
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
      @media only screen and (max-width: 500px) {
        .groups {
          max-width: calc(100% - 40px)!important;
        }
        .sidebar {
          max-width: calc(100% - 40px)!important;
        }
      }
      @media only screen and (max-width: 530px) {
        .players {
          max-width: calc(100% - 40px)!important;
        }
      }

      @media only screen and (min-width: 850px) {
        .groups {
          max-width: calc(50% - 13rem) !important;
        }
        .sidebar {
          max-width: calc(50% - 13rem) !important;
        }
      }

      .players {
        max-width: 20rem;
        width:100%;
      }
      .player__container {
        margin:0;
        background: #fff;
        border-radius: 0.25rem;
        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.19), 0 6px 6px -10px rgba(0, 0, 0, 0.23);
      }

      .body__cover {
        position: relative;
      }

      .body__cover img {
        max-width: 100%;
        width:100%;
        border-radius: 0.25rem;
      }

      .list {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        margin: 0;
        padding: 0;
        list-style-type: none;
      }

      .body__info,
      .player__footer {
        padding-right: 2rem;
        padding-left: 2rem;
      }


      .list--footer {
        justify-content: space-between;
      }
      .list--footer li:last-child {
        flex:1;
        display:flex;
        flex-direction: row;
        margin-left:15px;
      }
      .list--footer li:last-child input {
        flex:1;
      }
      .list--footer li:last-child ha-icon {
        margin:0 5px;
        color: #888;
        font-size:16px;
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
      .list--footer .list__link {
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
        padding-top: 1.5rem;
        padding-bottom: 1.25rem;
        text-align: center;
      }

      .info__album,
      .info__song {
        margin-bottom: .5rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .info__artist,
      .info__album {
        font-size: .75rem;
        font-weight: 300;
        color: #666;
      }
      
      .info__artist {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .info__song {
        font-size: 1.15rem;
        font-weight: 400;
        color: #d30320;
      }

      .body__buttons {
        padding-bottom: 2rem;
        padding-top: 1rem;
      }

      .list--buttons {
        display: flex;
        justify-content: center;
      }

      .list--buttons a {
        padding: 0.8rem;
        box-shadow: 0 3px 6px rgba(33, 33, 33, 0.1), 0 3px 12px rgba(33, 33, 33, 0.15);
      }
      .list--buttons a:focus, .list--buttons a:hover {
        color: rgba(171, 2, 26, 0.95);
        opacity: 1;
        box-shadow: 0 6px 9px rgba(33, 33, 33, 0.1), 0 6px 16px rgba(33, 33, 33, 0.15);
      }

      .list--buttons li:first-of-type a,
      .list--buttons li:last-of-type a {
        font-size: .95rem;
        color: #212121;
        opacity: .5;
      }
      .list--buttons li:first-of-type a:focus, .list--buttons li:first-of-type a:hover,
      .list--buttons li:last-of-type a:focus,
      .list--buttons li:last-of-type a:hover {
        color: #d30320;
        opacity: .75;
      }

      .list__link {
        -webkit-transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
        transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
        margin: 1rem;
        border-radius: 50%;
      }
      .list__link:focus, .list__link:hover {
        color: #d30320;
      }

      .player__footer {
        padding-top: 1rem;
        padding-bottom: 2rem;
      }

      .list--footer a {
        opacity: .5;
      }
      .list--footer a:focus, .list--footer a:hover {
        opacity: .9;
      }

      .shuffle.active {
        color: #d30320;
        opacity:0.9;
      }

      .center {
        margin:2rem auto;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        max-width: 1500px
      }

      .groups {
        margin: 0 20px 0 20px;
        padding: 0;
        max-width: 15rem;
        width: 100%;
      }
      .groups > .group {
        padding:0;
        margin:0;
      }
      .group .wrap {
        border-radius:4px;
        margin:5px 0;
        padding:15px;
        background-color:#f9f9f9;
      }
      .group .wrap.active {
        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.19), 0 6px 6px -10px rgba(0, 0, 0, 0.23);
        background-color:#FFF;
      }
      .group:first-child .wrap {
        margin-top:0;
      }
      .group ul.speakers {
        list-style:none;
        margin:0;
        padding:0;
      }
      .group ul.speakers li {
        display:block;
        font-size:12px;
        margin:5px 0 0 0 ;
        color:#000;
      }
      .group ul.speakers li:first-child {
        margin:0;
      }
      .group .play {
        display:flex;
        flex-direction:row;
        margin-top:10px;
      }
      .group .play .content {
        flex:1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .group .play .content .source {
        display:block;
        color:#CCC;
        font-size:10px;
      }
      .group .play .content .currentTrack {
        display:block;
        color:#CCC;
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
        max-width:15rem;
        width:100%;
      }
      .title {
        margin-top: 10px;
        text-align: center;
      }
      ul.members {
        list-style:none;
        padding:0;
        margin:0;
      }
      ul.members > li {
        padding:0;
        margin:0;
      }
      ul.members > li .member {
        border-radius:4px;
        margin:5px 0;
        padding:15px;
        background-color:#FFF;
        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.19), 0 6px 6px -10px rgba(0, 0, 0, 0.23);
        display:flex;
        flex-direction:row;
      }
      ul.members > li .member span {
        flex:1;
        align-self:center;
        font-size:12px;
        color:#000;
      }
      ul.members > li .member ha-icon {
        align-self:center;
        font-size:10px;
        color: #888;
      }
      ul.members > li .member:hover ha-icon {
        color: #d30320;
      }

      ul.favorites {
        list-style:none;
        padding:0;
        margin:0 0 30px 0;
      }
      ul.favorites > li {
        padding:0;
        margin:0;
      }
      ul.favorites > li .favorite {
        border-radius:4px;
        margin:5px 0;
        padding:15px;
        background-color:#FFF;
        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.19), 0 6px 6px -10px rgba(0, 0, 0, 0.23);
        display:flex;
        flex-direction:row;
      }
      ul.favorites > li .favorite span {
        flex:1;
        align-self:center;
        font-size:12px;
        color:#000;
      }
      ul.favorites > li .favorite ha-icon {
        align-self:center;
        font-size:10px;
        color: #888;
      }
      ul.favorites > li .favorite:hover ha-icon {
        color: #d30320;
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

}

customElements.define('custom-sonos-card', CustomSonosCard);
