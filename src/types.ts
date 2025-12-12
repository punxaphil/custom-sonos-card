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
  mediaBrowser?: string;
  groups?: string;
  grouping?: string;
  volumes?: string;
  queue?: string;
}

interface StyleConfig {
  borderRadius?: string;
}

export interface CardConfig extends LovelaceCardConfig {
  style?: StyleConfig;
  sections?: Section[];
  startSection?: Section;
  hidePlayerControlRepeatButton?: boolean;
  hidePlayerControlShuffleButton?: boolean;
  hidePlayerControlNextTrackButton?: boolean;
  hidePlayerControlPrevTrackButton?: boolean;
  hidePlayerControlPowerButton?: boolean;
  showVolumeUpAndDownButtons?: boolean;
  entityId?: string;
  entities?: string[];
  excludeItemsInEntitiesList?: boolean;
  predefinedGroups?: ConfigPredefinedGroup[];
  title?: string;
  labelWhenNoMediaIsSelected?: string;
  labelForTheAllVolumesSlider?: string;
  entityNameRegexToReplace?: string;
  entityNameReplacement?: string;
  artworkHostname?: string;
  widthPercentage?: number;
  heightPercentage?: number;
  hideGroupCurrentTrack?: boolean;
  dynamicVolumeSlider?: boolean;
  mediaArtworkOverrides?: MediaArtworkOverride[];
  customFavorites?: CustomFavorites;
  customFavoriteThumbnails?: CustomFavoriteThumbnails;
  customFavoriteThumbnailsIfMissing?: CustomFavoriteThumbnails;
  favoritesToIgnore?: string[];
  favoritesItemsPerRow?: number;
  favoritesHideTitleForThumbnailIcons?: boolean;
  topFavorites?: string[];
  numberOfFavoritesToShow?: number;
  hideBrowseMediaButton?: boolean;
  showAudioInputFormat?: boolean;
  entityPlatform?: string;
  showNonSonosPlayers?: boolean;
  fallbackArtwork?: string;
  entitiesToIgnoreVolumeLevelFor?: string[];
  replaceHttpWithHttpsForThumbnails?: boolean;
  volumeStepSize?: number;
  mediaBrowserTitle?: string;
  queueTitle?: string;
  adjustVolumeRelativeToMainPlayer?: boolean;
  skipApplyButtonWhenGrouping?: boolean;
  hideVolumeCogwheel?: boolean;
  dynamicVolumeSliderThreshold?: number;
  dynamicVolumeSliderMax?: number;
  artworkMinHeight?: number;
  artworkAsBackground?: boolean;
  artworkAsBackgroundBlur?: number;
  playerControlsAndHeaderBackgroundOpacity?: number;
  playerVolumeEntityId?: string;
  allowPlayerVolumeEntityOutsideOfGroup?: boolean;
  dontSwitchPlayerWhenGrouping?: boolean;
  showSourceInPlayer?: boolean;
  showBrowseMediaInPlayerSection?: boolean;
  showChannelInPlayer?: boolean;
  hidePlaylistInPlayer?: boolean;
  showFastForwardAndRewindButtons?: boolean;
  fastForwardAndRewindStepSizeSeconds?: number;
  groupingButtonIcons?: GroupingButtonIcons;
  sectionButtonIcons?: SectionButtonIcons;
  footerHeight?: number;
  mediaTitleRegexToReplace?: string;
  mediaTitleReplacement?: string;
  stopInsteadOfPause?: boolean;
  inverseGroupMuteState?: boolean;
  storePlayerInSessionStorage?: boolean;
  sortFavoritesByType?: boolean;
  doNotRememberSelectedPlayer?: boolean;
  groupingDontSortMembersOnTop?: boolean;
  changeVolumeOnSlide?: boolean;
  hideMediaBrowserHeader?: boolean;
  compactGroups?: boolean;
  compactGrouping?: boolean;
  groupingDisableMainSpeakers?: boolean;
  hidePlayerArtwork?: boolean;
  playerControlsLargeIcons?: boolean;
  sectionButtonIconSize?: number;
  minWidth?: number;
  hideGroupUngroupAllButtons?: boolean;
  playerHeaderEntityFontSize?: number;
  playerHeaderSongFontSize?: number;
  playerHideVolumePercentage?: boolean;
  playerHideVolumeMuteButton?: boolean;
  playerHideHeader?: boolean;
  playerHideControls?: boolean;
  playerControlsColor?: string;
  favoritesIconTitleColor?: string;
  favoritesIconTitleBackgroundColor?: string;
  favoritesIconBorder?: string;
  baseFontSize?: number;
  groupButtonWidth?: number;
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
