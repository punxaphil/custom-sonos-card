import { HomeAssistant, LovelaceCardConfig } from 'custom-card-helpers';
import { MediaPlayer } from './model/media-player';

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    customCards: Array<{ type: string; name: string; description: string; preview: boolean }>;
  }
}

export enum Section {
  FAVORITES = 'favorites',
  GROUPS = 'groups',
  PLAYER = 'player',
  GROUPING = 'grouping',
  VOLUMES = 'volumes',
  QUEUE = 'queue',
}

export type ConfigPredefinedGroupPlayer = PredefinedGroupPlayer<string>;
export type ConfigPredefinedGroup = PredefinedGroup<string | ConfigPredefinedGroupPlayer>;
export type CalculateVolume = (member: MediaPlayer, volumeStepSize: number) => number;

export interface GroupingButtonIcons {
  predefinedGroup?: string;
  unJoinAll?: string;
  joinAll?: string;
}

interface SectionButtonIcons {
  player?: string;
  favorites?: string;
  groups?: string;
  grouping?: string;
  volumes?: string;
  queue?: string;
}

interface StyleConfig {
  borderRadius?: string;
}

export interface PlayerConfig {
  artworkAsBackground?: boolean;
  artworkAsBackgroundBlur?: number;
  artworkHostname?: string;
  artworkMinHeight?: number;
  backgroundOverlayColor?: string;
  controlsAndHeaderBackgroundOpacity?: number;
  controlsColor?: string;
  controlsLargeIcons?: boolean;
  controlsMargin?: string;
  fallbackArtwork?: string;
  fastForwardAndRewindStepSizeSeconds?: number;
  headerEntityFontSize?: number;
  headerSongFontSize?: number;
  hideArtistAlbum?: boolean;
  hideArtwork?: boolean;
  hideControlNextTrackButton?: boolean;
  hideControlPowerButton?: boolean;
  hideControlPrevTrackButton?: boolean;
  hideControlRepeatButton?: boolean;
  hideControlShuffleButton?: boolean;
  hideControls?: boolean;
  hideEntityName?: boolean;
  hideHeader?: boolean;
  hidePlaylist?: boolean;
  hideVolume?: boolean;
  hideVolumeMuteButton?: boolean;
  hideVolumePercentage?: boolean;
  labelWhenNoMediaIsSelected?: string;
  mediaArtworkOverrides?: MediaArtworkOverride[];
  showAudioInputFormat?: boolean;
  showBrowseMediaButton?: boolean;
  showChannel?: boolean;
  showFastForwardAndRewindButtons?: boolean;
  showSource?: boolean;
  showVolumeUpAndDownButtons?: boolean;
  stopInsteadOfPause?: boolean;
  volumeEntityId?: string;
  volumeMuteButtonSize?: number;
  volumeSliderHeight?: number;
}

export interface FavoritesConfig {
  customFavorites?: CustomFavorites;
  customThumbnails?: CustomFavoriteThumbnails;
  customThumbnailsIfMissing?: CustomFavoriteThumbnails;
  hideBrowseMediaButton?: boolean;
  hideHeader?: boolean;
  hideTitleForThumbnailIcons?: boolean;
  iconBorder?: string;
  iconPadding?: number;
  iconTitleBackgroundColor?: string;
  iconTitleColor?: string;
  itemsPerRow?: number;
  numberToShow?: number;
  replaceHttpWithHttpsForThumbnails?: boolean;
  sortByType?: boolean;
  title?: string;
  exclude?: string[];
  topItems?: string[];
}

export interface GroupsConfig {
  buttonWidth?: number;
  compact?: boolean;
  hideCurrentTrack?: boolean;
  itemMargin?: string;
  title?: string;
}

export interface GroupingConfig {
  buttonColor?: string;
  buttonFontSize?: number;
  buttonIcons?: GroupingButtonIcons;
  compact?: boolean;
  disableMainSpeakers?: boolean;
  dontSortMembersOnTop?: boolean;
  dontSwitchPlayer?: boolean;
  hideUngroupAllButtons?: boolean;
  skipApplyButton?: boolean;
  title?: string;
}

export interface VolumesConfig {
  additionalControlsFontSize?: number;
  hideCogwheel?: boolean;
  labelForAllSlider?: string;
  title?: string;
}

export interface QueueConfig {
  itemBackgroundColor?: string;
  itemTextColor?: string;
  title?: string;
}

export interface CardConfig extends LovelaceCardConfig {
  style?: StyleConfig;
  sections?: Section[];
  startSection?: Section;
  // Common
  adjustVolumeRelativeToMainPlayer?: boolean;
  allowPlayerVolumeEntityOutsideOfGroup?: boolean;
  baseFontSize?: number;
  changeVolumeOnSlide?: boolean;
  doNotRememberSelectedPlayer?: boolean;
  dynamicVolumeSlider?: boolean;
  dynamicVolumeSliderMax?: number;
  dynamicVolumeSliderThreshold?: number;
  entities?: string[];
  entitiesToIgnoreVolumeLevelFor?: string[];
  entityId?: string;
  entityNameRegexToReplace?: string;
  entityNameReplacement?: string;
  entityPlatform?: string;
  excludeItemsInEntitiesList?: boolean;
  footerHeight?: number;
  heightPercentage?: number;
  inverseGroupMuteState?: boolean;
  mediaTitleRegexToReplace?: string;
  mediaTitleReplacement?: string;
  minWidth?: number;
  predefinedGroups?: ConfigPredefinedGroup[];
  sectionButtonIconSize?: number;
  sectionButtonIcons?: SectionButtonIcons;
  showNonSonosPlayers?: boolean;
  storePlayerInSessionStorage?: boolean;
  title?: string;
  volumeStepSize?: number;
  widthPercentage?: number;
  // Section configs
  player?: PlayerConfig;
  favorites?: FavoritesConfig;
  groups?: GroupsConfig;
  grouping?: GroupingConfig;
  volumes?: VolumesConfig;
  queue?: QueueConfig;
}

export interface MediaArtworkOverride {
  ifMissing?: boolean;
  mediaTitleEquals?: string;
  mediaArtistEquals?: string;
  mediaAlbumNameEquals?: string;
  mediaContentIdEquals?: string;
  mediaChannelEquals?: string;
  imageUrl?: string;
  sizePercentage?: number;
}

export interface CustomFavorites {
  [name: string]: CustomFavorite[];
}

export interface CustomFavorite {
  title: string;
  thumbnail?: string;
}

export interface CustomFavoriteThumbnails {
  [title: string]: string;
}

export interface MediaPlayerItem {
  can_play?: boolean;
  can_expand?: boolean;
  title: string;
  thumbnail?: string;
  children?: MediaPlayerItem[];
  children_media_class?: string;
  media_class?: string;
  media_content_type?: string;
  media_content_id?: string;
  favoriteType?: string;
}

export interface PredefinedGroup<T = PredefinedGroupPlayer> {
  name: string;
  entities: T[];
  media?: string;
  volume?: number;
  unmuteWhenGrouped?: boolean;
  excludeItemsInEntitiesList?: boolean;
  bass?: number;
  treble?: number;
  loudness?: boolean;
  nightSound?: boolean;
  speechEnhancement?: boolean;
  crossfade?: boolean;
  touchControls?: boolean;
  statusLight?: boolean;
}

export interface PredefinedGroupPlayer<T = MediaPlayer> {
  player: T;
  volume?: number;
}

export interface TemplateResult<T = string[]> {
  result: T;
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

export type GetQueueResponse = {
  response: {
    [entity_id: string]: QueueItem[];
  };
};

export interface QueueItem {
  media_title: string;
  media_album_name: string;
  media_artist: string;
  media_content_id: string;
}
