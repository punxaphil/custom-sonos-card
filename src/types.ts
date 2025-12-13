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

export interface CardConfig extends LovelaceCardConfig {
  style?: StyleConfig;
  sections?: Section[];
  startSection?: Section;
  // Common
  baseFontSize?: number;
  doNotRememberSelectedPlayer?: boolean;
  entityId?: string;
  entities?: string[];
  entityNameRegexToReplace?: string;
  entityNameReplacement?: string;
  entityPlatform?: string;
  excludeItemsInEntitiesList?: boolean;
  footerHeight?: number;
  heightPercentage?: number;
  mediaTitleRegexToReplace?: string;
  mediaTitleReplacement?: string;
  minWidth?: number;
  sectionButtonIconSize?: number;
  sectionButtonIcons?: SectionButtonIcons;
  showNonSonosPlayers?: boolean;
  storePlayerInSessionStorage?: boolean;
  title?: string;
  widthPercentage?: number;
  // Player
  allowPlayerVolumeEntityOutsideOfGroup?: boolean;
  playerArtworkAsBackground?: boolean;
  playerArtworkAsBackgroundBlur?: number;
  playerArtworkHostname?: string;
  playerArtworkMinHeight?: number;
  playerBackgroundOverlayColor?: string;
  playerControlsAndHeaderBackgroundOpacity?: number;
  playerControlsColor?: string;
  playerControlsLargeIcons?: boolean;
  playerControlsMargin?: string;
  dynamicVolumeSlider?: boolean;
  dynamicVolumeSliderMax?: number;
  dynamicVolumeSliderThreshold?: number;
  entitiesToIgnoreVolumeLevelFor?: string[];
  playerFallbackArtwork?: string;
  playerFastForwardAndRewindStepSizeSeconds?: number;
  playerHeaderEntityFontSize?: number;
  playerHeaderSongFontSize?: number;
  playerHideArtistAlbum?: boolean;
  playerHideArtwork?: boolean;
  playerHideControls?: boolean;
  playerHideControlNextTrackButton?: boolean;
  playerHideControlPowerButton?: boolean;
  playerHideControlPrevTrackButton?: boolean;
  playerHideControlRepeatButton?: boolean;
  playerHideControlShuffleButton?: boolean;
  playerHideEntityName?: boolean;
  playerHideHeader?: boolean;
  playerHidePlaylist?: boolean;
  playerHideVolume?: boolean;
  playerHideVolumeMuteButton?: boolean;
  playerHideVolumePercentage?: boolean;
  playerLabelWhenNoMediaIsSelected?: string;
  playerMediaArtworkOverrides?: MediaArtworkOverride[];
  playerShowAudioInputFormat?: boolean;
  playerShowBrowseMediaButton?: boolean;
  playerShowChannel?: boolean;
  playerShowFastForwardAndRewindButtons?: boolean;
  playerShowSource?: boolean;
  playerShowVolumeUpAndDownButtons?: boolean;
  playerStopInsteadOfPause?: boolean;
  playerVolumeEntityId?: string;
  playerVolumeMuteButtonSize?: number;
  playerVolumeSliderHeight?: number;
  // Favorites
  favoritesCustomFavorites?: CustomFavorites;
  favoritesCustomThumbnails?: CustomFavoriteThumbnails;
  favoritesCustomThumbnailsIfMissing?: CustomFavoriteThumbnails;
  favoritesHideBrowseMediaButton?: boolean;
  favoritesHideHeader?: boolean;
  favoritesHideTitleForThumbnailIcons?: boolean;
  favoritesIconBorder?: string;
  favoritesIconPadding?: number;
  favoritesIconTitleBackgroundColor?: string;
  favoritesIconTitleColor?: string;
  favoritesItemsPerRow?: number;
  favoritesNumberToShow?: number;
  favoritesReplaceHttpWithHttpsForThumbnails?: boolean;
  favoritesSortByType?: boolean;
  favoritesTitle?: string;
  favoritesToIgnore?: string[];
  favoritesTopItems?: string[];
  // Groups
  groupsButtonWidth?: number;
  groupsCompact?: boolean;
  groupsHideCurrentTrack?: boolean;
  groupsItemMargin?: string;
  groupsTitle?: string;
  // Grouping
  groupingButtonColor?: string;
  groupingButtonFontSize?: number;
  groupingButtonIcons?: GroupingButtonIcons;
  groupingCompact?: boolean;
  groupingDisableMainSpeakers?: boolean;
  groupingDontSortMembersOnTop?: boolean;
  groupingDontSwitchPlayer?: boolean;
  groupingHideUngroupAllButtons?: boolean;
  predefinedGroups?: ConfigPredefinedGroup[];
  groupingSkipApplyButton?: boolean;
  // Volumes
  adjustVolumeRelativeToMainPlayer?: boolean;
  changeVolumeOnSlide?: boolean;
  volumesHideCogwheel?: boolean;
  inverseGroupMuteState?: boolean;
  volumesLabelForAllSlider?: string;
  volumeStepSize?: number;
  // Queue
  queueItemBackgroundColor?: string;
  queueItemTextColor?: string;
  queueTitle?: string;
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
