import { HomeAssistant, LovelaceCardConfig } from 'custom-card-helpers';
import { MediaPlayer } from './model/media-player';

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    customCards: Array<{ type: string; name: string; description: string; preview: boolean }>;
  }
}

export enum Section {
  GROUPS = 'groups',
  MEDIA_BROWSER = 'media browser',
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
  groups?: string;
  grouping?: string;
  mediaBrowser?: string;
  volumes?: string;
  queue?: string;
}

interface StyleConfig {
  borderRadius?: string;
}

export interface PlayerConfig {
  artworkAsBackground?: boolean;
  artworkAsBackgroundBlur?: number;
  artworkBorderRadius?: number;
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
  exclude?: string[];
  hideTitleForThumbnailIcons?: boolean;
  iconBorder?: string;
  iconPadding?: number;
  iconTitleBackgroundColor?: string;
  iconTitleColor?: string;
  numberToShow?: number;
  sortByType?: boolean;
  title?: string;
  topItems?: string[];
  typeColor?: string;
  typeFontSize?: string;
  typeFontWeight?: string;
  typeMarginBottom?: string;
}

export interface MediaBrowserConfig {
  favorites?: FavoritesConfig;
  hideHeader?: boolean;
  itemsPerRow?: number;
  onlyFavorites?: boolean;
}

export interface GroupsConfig {
  backgroundColor?: string;
  buttonWidth?: number;
  compact?: boolean;
  hideCurrentTrack?: boolean;
  itemMargin?: string;
  speakersFontSize?: number;
  title?: string;
  titleFontSize?: number;
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
  selectedItemBackgroundColor?: string;
  selectedItemTextColor?: string;
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
  fontFamily?: string;
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
  groups?: GroupsConfig;
  grouping?: GroupingConfig;
  volumes?: VolumesConfig;
  queue?: QueueConfig;
  mediaBrowser?: MediaBrowserConfig;
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

import { MediaPlayerItem as UpstreamMediaPlayerItem } from './upstream/data/media-player';

export interface MediaPlayerItem extends Partial<UpstreamMediaPlayerItem> {
  title: string;
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
