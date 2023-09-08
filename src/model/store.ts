import { HomeAssistant } from 'custom-card-helpers';
import HassService from '../services/hass-service';
import MediaBrowseService from '../services/media-browse-service';
import MediaControlService from '../services/media-control-service';
import { CardConfig, PredefinedGroup } from '../types';
import { getGroupPlayerIds } from '../utils/utils';
import { MediaPlayer } from './media-player';
import { HassEntity } from 'home-assistant-js-websocket';

export default class Store {
  public hass: HomeAssistant;
  public config: CardConfig;
  public activePlayer!: MediaPlayer;
  public allGroups: MediaPlayer[];
  public hassService: HassService;
  public mediaControlService: MediaControlService;
  public mediaBrowseService: MediaBrowseService;
  public allMediaPlayers: MediaPlayer[];
  public predefinedGroups?: PredefinedGroup[];

  constructor(hass: HomeAssistant, config: CardConfig, activePlayerId?: string) {
    this.hass = hass;
    this.config = config;
    const mediaPlayerHassEntities = this.getMediaPlayerHassEntities();
    this.allGroups = this.createPlayerGroups(mediaPlayerHassEntities);
    this.allMediaPlayers = this.allGroups
      .reduce(
        (previousValue: MediaPlayer[], currentValue) => [...previousValue, currentValue, ...currentValue.members],
        [],
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    this.activePlayer = this.determineActivePlayer(activePlayerId);
    const section = this.config.sections?.[0];
    this.hassService = new HassService(this.hass, section);
    this.mediaControlService = new MediaControlService(this.hassService, this.allGroups, this.config);
    this.mediaBrowseService = new MediaBrowseService(this.hassService);
    this.predefinedGroups = this.createPredefinedGroups();
  }

  private createPredefinedGroups() {
    if (this.config.predefinedGroups) {
      const predefinedGroups: PredefinedGroup[] = this.config.predefinedGroups;
      predefinedGroups?.forEach((pg) => this.filterUnavailablePlayers(pg));
      return predefinedGroups?.filter((group) => group.entities.length > 1);
    }
    return [];
  }

  private filterUnavailablePlayers(pg: PredefinedGroup) {
    pg.entities = pg.entities.filter((item) => {
      return this.hass.states[item]?.state !== 'unavailable';
    });
  }

  private getMediaPlayerHassEntities() {
    if (this.config.entities) {
      return [...new Set(this.config.entities)]
        .map((player) => this.hass.states[player])
        .filter((hassEntity) => hassEntity !== undefined);
    } else {
      return Object.values(this.hass.states)
        .filter(getGroupPlayerIds)
        .sort((a, b) => a.entity_id.localeCompare(b.entity_id));
    }
  }

  private createPlayerGroups(mediaPlayerHassEntities: HassEntity[]) {
    return mediaPlayerHassEntities
      .filter((hassEntity) => this.isMainPlayer(hassEntity, mediaPlayerHassEntities))
      .map((hassEntity) => this.createPlayerGroup(hassEntity, mediaPlayerHassEntities))
      .filter((grp) => grp !== undefined) as MediaPlayer[];
  }

  private isMainPlayer(hassEntity: HassEntity, mediaPlayerHassEntities: HassEntity[]) {
    try {
      const sonosGroup = getGroupPlayerIds(hassEntity).filter((playerId: string) =>
        mediaPlayerHassEntities.some((value) => value.entity_id === playerId),
      );
      const isGrouped = sonosGroup?.length > 1;
      const isMainInGroup = isGrouped && sonosGroup && sonosGroup[0] === hassEntity.entity_id;
      return !isGrouped || isMainInGroup;
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
    const playerId = activePlayerId || this.config.entityId || this.getActivePlayerFromUrl();
    return (
      this.allGroups.find((group) => group.getPlayer(playerId) !== undefined) ||
      this.allGroups.find((group) => group.isPlaying()) ||
      this.allGroups[0]
    );
  }

  private getActivePlayerFromUrl() {
    return window.location.href.indexOf('#') > 0 ? window.location.href.replace(/.*#/g, '') : '';
  }
}
