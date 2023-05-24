import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import HassService from './services/hass-service';
import MediaBrowseService from './services/media-browse-service';
import MediaControlService from './services/media-control-service';
import { CardConfig, PlayerGroups } from './types';
import { getEntityName, getGroupMembers, isPlaying } from './utils';

export default class Store {
  public hass: HomeAssistant;
  public config: CardConfig;
  public entity!: HassEntity;
  public entityId!: string;
  public groups: PlayerGroups;
  public hassService: HassService;
  public mediaControlService: MediaControlService;
  public mediaPlayers: string[];
  public mediaBrowseService: MediaBrowseService;

  constructor(hass: HomeAssistant, config: CardConfig) {
    this.hass = hass;
    this.config = config;
    this.mediaPlayers = this.getMediaPlayers();
    this.groups = this.createPlayerGroups(this.mediaPlayers);
    const entityId = this.determineEntityId(this.groups);
    this.updateEntity(entityId);
    const section = this.config.sections?.[0];
    this.hassService = new HassService(this.hass, section);
    this.mediaControlService = new MediaControlService(this.hass, this.hassService);
    this.mediaBrowseService = new MediaBrowseService(this.hass, this.hassService);
  }

  public updateEntity(entityId: string) {
    this.entityId = entityId;
    this.entity = this.hass.states[this.entityId];
  }

  getMediaPlayers() {
    if (this.config.entities) {
      return [...new Set(this.config.entities)].filter((player) => this.hass.states[player]);
    } else {
      return Object.values(this.hass.states)
        .filter(getGroupMembers)
        .map((state) => state.entity_id)
        .sort();
    }
  }

  createPlayerGroups(mediaPlayers: string[]): PlayerGroups {
    const groupMasters = mediaPlayers.filter((player) => this.createGroupMasters(player, mediaPlayers));
    const groupArray = groupMasters.map((groupMaster) => this.createGroupArray(groupMaster, mediaPlayers));
    return Object.fromEntries(groupArray.map((group) => [group.entity, group]));
  }

  createGroupMasters(player: string, mediaPlayers: string[]) {
    const state = this.hass.states[player];
    try {
      const sonosGroup = getGroupMembers(state).filter((member: string) => mediaPlayers.indexOf(member) > -1);
      const isGrouped = sonosGroup?.length > 1;
      const isMasterInGroup = isGrouped && sonosGroup && sonosGroup[0] === player;
      return !isGrouped || isMasterInGroup;
    } catch (e) {
      console.error('Failed to determine group master', JSON.stringify(state), e);
      return false;
    }
  }

  createGroupArray(groupMaster: string, mediaPlayers: string[]) {
    const state = this.hass.states[groupMaster];
    try {
      const membersArray = getGroupMembers(state).filter((member: string) => {
        return member !== groupMaster && mediaPlayers.indexOf(member) > -1;
      });
      return {
        entity: groupMaster,
        state: state.state,
        roomName: getEntityName(this.hass, this.config, groupMaster),
        members: this.createGroupMembers(membersArray),
      };
    } catch (e) {
      console.error('Failed to create group', JSON.stringify(state), e);
      return {};
    }
  }

  createGroupMembers(membersArray: string[]) {
    return Object.fromEntries(
      membersArray.map((member: string) => {
        const friendlyName = getEntityName(this.hass, this.config, member);
        return [member, friendlyName];
      }),
    );
  }

  determineEntityId(playerGroups: PlayerGroups) {
    const entityId = window.location.href.indexOf('#') > 0 ? window.location.href.replace(/.*#/g, '') : '';
    let result;
    for (const player in playerGroups) {
      if (player === entityId) {
        result = player;
      } else {
        for (const member in playerGroups[player].members) {
          if (member === entityId) {
            result = player;
          }
        }
      }
    }
    if (!result) {
      for (const player in playerGroups) {
        if (isPlaying(playerGroups[player].state)) {
          result = player;
        }
      }
    }
    if (!result) {
      result = Object.keys(playerGroups)[0];
    }
    return result;
  }
}
