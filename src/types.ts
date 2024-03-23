import { HomeAssistant, LovelaceCardConfig } from 'custom-card-helpers';
import { MediaPlayer } from './model/media-player';

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    customCards: Array<{ type: string; name: string; description: string; preview: boolean }>;
  }
}

export enum Section {
  MEDIA_BROWSER = 'media browser',
  GROUPS = 'groups',
  PLAYER = 'player',
  GROUPING = 'grouping',
  VOLUMES = 'volumes',
}

export type ConfigPredefinedGroupPlayer = PredefinedGroupPlayer<string>;
export type ConfigPredefinedGroup = PredefinedGroup<string | ConfigPredefinedGroupPlayer>;
export type CalculateVolume = (member: MediaPlayer, volumeStepSize: number) => number;

export interface CardConfig extends LovelaceCardConfig {
  sections?: Section[];
  showVolumeUpAndDownButtons?: boolean;
  entities?: string[];
  excludeItemsInEntitiesList?: boolean;
  predefinedGroups?: ConfigPredefinedGroup[];
  title?: string;
  labelWhenNoMediaIsSelected?: string;
  labelForTheAllVolumesSlider: string;
  entityNameRegexToReplace?: string;
  entityNameReplacement?: string;
  artworkHostname?: string;
  widthPercentage?: number;
  heightPercentage?: number;
  hideGroupCurrentTrack?: boolean;
  dynamicVolumeSlider?: boolean;
  mediaArtworkOverrides?: MediaArtworkOverride[];
  customSources?: CustomSources;
  customThumbnail?: CustomThumbnails;
  customThumbnailIfMissing?: CustomThumbnails;
  favoritesToIgnore?: string[];
  mediaBrowserItemsPerRow?: number;
  mediaBrowserHideTitleForThumbnailIcons?: boolean;
  topFavorites?: string[];
  numberOfFavoritesToShow?: number;
  hideBrowseMediaButton?: boolean;
  showAudioInputFormat?: boolean;
  showNonSonosPlayers?: boolean;
  fallbackArtwork?: string;
  entitiesToIgnoreVolumeLevelFor?: string[];
  replaceHttpWithHttpsForThumbnails?: boolean;
  volumeStepSize?: number;
  mediaBrowserTitle?: string;
  adjustVolumeRelativeToMainPlayer?: boolean;
  skipApplyButtonWhenGrouping?: boolean;
  hideVolumeCogwheel?: boolean;
  dynamicVolumeSliderThreshold?: number;
  dynamicVolumeSliderMax?: number;
  artworkMinHeight?: number;
  artworkAsBackground?: boolean;
  playerVolumeOnlyAffectsMainPlayer?: boolean;
}

export interface MediaArtworkOverride {
  ifMissing?: boolean;
  mediaTitleEquals?: string;
  mediaContentIdEquals?: string;
  mediaChannelEquals?: string;
  imageUrl?: string;
  sizePercentage?: number;
}

export interface CustomSources {
  [name: string]: CustomSource[];
}

export interface CustomSource {
  title: string;
  thumbnail?: string;
}

export interface CustomThumbnails {
  [title: string]: string;
}

export interface MediaPlayerItem {
  title: string;
  thumbnail?: string;
  children?: MediaPlayerItem[];
  children_media_class?: string;
  media_class?: string;
  media_content_type?: string;
  media_content_id?: string;
}

export interface PredefinedGroup<T = PredefinedGroupPlayer> {
  name: string;
  entities: T[];
  media?: string;
  volume?: number;
  unmuteWhenGrouped?: boolean;
  excludeItemsInEntitiesList?: boolean;
}

export interface PredefinedGroupPlayer<T = MediaPlayer> {
  player: T;
  volume?: number;
}
export interface TemplateResult {
  result: string[];
}

export enum MediaPlayerEntityFeature {
  PAUSE = 1,
  SEEK = 2,
  VOLUME_SET = 4,
  VOLUME_MUTE = 8,
  PREVIOUS_TRACK = 16,
  NEXT_TRACK = 32,

  TURN_ON = 128,
  TURN_OFF = 256,
  PLAY_MEDIA = 512,
  VOLUME_BUTTONS = 1024,
  SELECT_SOURCE = 2048,
  STOP = 4096,
  CLEAR_PLAYLIST = 8192,
  PLAY = 16384,
  SHUFFLE_SET = 32768,
  SELECT_SOUND_MODE = 65536,
  BROWSE_MEDIA = 131072,
  REPEAT_SET = 262144,
  GROUPING = 524288,
}

interface HassEntityExtended {
  platform: string;
}

export interface HomeAssistantWithEntities extends HomeAssistant {
  entities: {
    [entity_id: string]: HassEntityExtended;
  };
}
