import { HomeAssistant } from 'custom-card-helpers';
import HassService from '../services/hass-service';
import { SESSION_STORAGE_PLAYER_ID } from '../constants';
import MediaBrowseService from '../services/media-browse-service';
import MediaControlService from '../services/media-control-service';
import {
  CardConfig,
  ConfigPredefinedGroup,
  ConfigPredefinedGroupPlayer,
  HomeAssistantWithEntities,
  PredefinedGroup,
  PredefinedGroupPlayer,
  Section,
} from '../types';
import {
  entityMatchMxmp,
  entityMatchSonos,
  getGroupPlayerIds,
  isSonosCard,
  sortEntities,
  supportsTurnOn,
} from '../utils/utils';
import { MediaPlayer } from './media-player';
import { HassEntity } from 'home-assistant-js-websocket';
import { nothing } from 'lit';

export default class Store {
  public hass: HomeAssistant;
  public config: CardConfig;
  public activePlayer!: MediaPlayer;
  public allGroups: MediaPlayer[];
  public hassService: HassService;
  public mediaControlService: MediaControlService;
  public mediaBrowseService: MediaBrowseService;
  public allMediaPlayers: MediaPlayer[];
  public predefinedGroups: PredefinedGroup[];

  constructor(
    hass: HomeAssistant,
    config: CardConfig,
    currentSection: Section,
    card: Element,
    activePlayerId?: string,
  ) {
    this.hass = hass;
    this.config = config;
    const mediaPlayerHassEntities = this.getMediaPlayerHassEntities(this.hass);
    this.allGroups = this.createPlayerGroups(mediaPlayerHassEntities);
    this.allMediaPlayers = this.allGroups.reduce(
      (previousValue: MediaPlayer[], currentValue) => [...previousValue, ...currentValue.members],
      [],
    );
    this.activePlayer = this.determineActivePlayer(activePlayerId);
    this.hassService = new HassService(this.hass, currentSection, card, config);
    this.mediaControlService = new MediaControlService(this.hassService, config);
    this.mediaBrowseService = new MediaBrowseService(this.hassService, config);
    this.predefinedGroups = this.createPredefinedGroups();
  }

  private createPredefinedGroups() {
    const result: PredefinedGroup[] = [];
    if (this.config.predefinedGroups) {
      for (const cpg of this.config.predefinedGroups) {
        const pg = this.createPredefinedGroup(cpg);
        if (pg) {
          result.push(pg);
        }
      }
    }
    return result;
  }

  private createPredefinedGroup(configItem: ConfigPredefinedGroup): PredefinedGroup | undefined {
    let result = undefined;
    const entities: PredefinedGroupPlayer[] = [];
    let configEntities = configItem.entities;
    if (configItem.excludeItemsInEntitiesList) {
      configEntities = this.convertExclusionsInPredefinedGroupsToInclusions(configEntities);
    }
    for (const item of configEntities) {
      const predefinedGroupPlayer = this.createPredefinedGroupPlayer(item);
      if (predefinedGroupPlayer) {
        entities.push(predefinedGroupPlayer);
      }
    }
    if (entities.length) {
      result = {
        ...configItem,
        entities,
      };
    }
    return result;
  }

  private convertExclusionsInPredefinedGroupsToInclusions(configEntities: (string | ConfigPredefinedGroupPlayer)[]) {
    return this.allMediaPlayers
      .filter(
        (mp) =>
          !configEntities.find((player) => {
            return (typeof player === 'string' ? player : player.player) === mp.id;
          }),
      )
      .map((mp) => mp.id);
  }

  private createPredefinedGroupPlayer(configItem: string | ConfigPredefinedGroupPlayer) {
    let pgEntityId: string;
    let volume;
    if (typeof configItem === 'string') {
      pgEntityId = configItem;
    } else {
      volume = configItem.volume;
      pgEntityId = configItem.player;
    }
    let result = undefined;
    if (this.hass.states[pgEntityId]?.state !== 'unavailable') {
      const player = this.allMediaPlayers.find((p) => p.id === pgEntityId);
      if (player) {
        result = { player, volume };
      }
    } else {
      console.warn(`Player ${pgEntityId} is unavailable`);
    }
    return result;
  }

  public getMediaPlayerHassEntities(hass: HomeAssistant) {
    const hassWithEntities = hass as HomeAssistantWithEntities;
    const filtered = Object.values(hass.states).filter((hassEntity) => {
      if (hassEntity.entity_id.includes('media_player')) {
        if (isSonosCard(this.config)) {
          return entityMatchSonos(this.config, hassEntity, hassWithEntities);
        } else {
          return entityMatchMxmp(this.config, hassEntity, hassWithEntities);
        }
      }
      return false;
    });
    return sortEntities(this.config, filtered);
  }

  private createPlayerGroups(mediaPlayerHassEntities: HassEntity[]) {
    return mediaPlayerHassEntities
      .filter((hassEntity) => this.isMainPlayer(hassEntity, mediaPlayerHassEntities))
      .map((hassEntity) => this.createPlayerGroup(hassEntity, mediaPlayerHassEntities))
      .filter((grp) => grp !== undefined) as MediaPlayer[];
  }

  private isMainPlayer(hassEntity: HassEntity, mediaPlayerHassEntities: HassEntity[]) {
    try {
      const groupIds = getGroupPlayerIds(hassEntity).filter((playerId: string) =>
        mediaPlayerHassEntities.some((value) => value.entity_id === playerId),
      );
      const isGrouped = groupIds?.length > 1;
      const isMainInGroup = isGrouped && groupIds && groupIds[0] === hassEntity.entity_id;
      const available = this.hass.states[hassEntity.entity_id]?.state !== 'unavailable';
      return (!isGrouped || isMainInGroup) && available;
    } catch (e) {
      console.error('Failed to determine main player', JSON.stringify(hassEntity), e);
      return false;
    }
  }

  private createPlayerGroup(hassEntity: HassEntity, mediaPlayerHassEntities: HassEntity[]): MediaPlayer | undefined {
    try {
      return new MediaPlayer(hassEntity, this.config, mediaPlayerHassEntities);
    } catch (e) {
      console.error('Failed to create group', JSON.stringify(hassEntity), e);
      return undefined;
    }
  }

  private determineActivePlayer(activePlayerId?: string): MediaPlayer {
    const playerId = activePlayerId || this.getActivePlayer() || this.config.entityId;
    return (
      this.allGroups.find((group) => group.getMember(playerId) !== undefined) ||
      this.allGroups.find((group) => group.isPlaying()) ||
      this.allGroups[0]
    );
  }

  private getActivePlayer() {
    if (this.config.doNotRememberSelectedPlayer) {
      return '';
    }
    if (this.config.storePlayerInSessionStorage) {
      return this.getActivePlayerFromStorage();
    }
    return this.getActivePlayerFromUrl();
  }

  private getActivePlayerFromUrl() {
    return window.location.href.includes('#') ? window.location.href.replace(/.*#/g, '') : '';
  }

  private getActivePlayerFromStorage(): string {
    return window.sessionStorage.getItem(SESSION_STORAGE_PLAYER_ID) || '';
  }

  hidePower(hideIfOn = false) {
    if (this.config.player?.hideControlPowerButton) {
      return true;
    } else if (!supportsTurnOn(this.activePlayer)) {
      return true;
    } else if (hideIfOn && this.activePlayer.isOn()) {
      return true;
    } else {
      return nothing;
    }
  }
}
