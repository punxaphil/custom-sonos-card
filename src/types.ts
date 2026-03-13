import { HomeAssistant, LovelaceCardConfig } from 'custom-card-helpers';
import { MediaPlayer } from './model/media-player';
import { MediaPlayerItem as UpstreamMediaPlayerItem } from './upstream/data/media-player';
import type { SearchConfig } from './sections/search/search.types';

export type {
  LibraryFilter,
  SearchConfig,
  SearchMediaType,
  SearchResultItem,
  SearchExecutionState,
  MusicAssistantSearchResult,
  MusicAssistantSearchResponse,
} from './sections/search/search.types';

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
  SEARCH = 'search',
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
  search?: string;
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
  iconMarginPercentage?: number;
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

export interface MediaBrowserShortcut {
  icon?: string;
  name: string;
  media_content_id: string;
  media_content_type: string;
}

export interface MediaBrowserConfig {
  favorites?: FavoritesConfig;
  hideHeader?: boolean;
  hideActivePlayerName?: boolean;
  itemsPerRow?: number;
  onlyFavorites?: boolean;
  shortcut?: MediaBrowserShortcut;
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
  hideVolumes?: boolean;
  skipApplyButton?: boolean;
  title?: string;
}

export interface VolumesConfig {
  additionalControlsFontSize?: number;
  hideCogwheel?: boolean;
  hideActivePlayerName?: boolean;
  labelForAllSlider?: string;
  title?: string;
}

export interface QueueConfig {
  hideActivePlayerName?: boolean;
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
  listItemHeight?: number;
  mediaTitleRegexToReplace?: string;
  mediaTitleReplacement?: string;
  minWidth?: number;
  predefinedGroups?: ConfigPredefinedGroup[];
  sectionButtonIconSize?: number;
  sectionButtonIcons?: SectionButtonIcons;
  showNonSonosPlayers?: boolean;
  storePlayerInSessionStorage?: boolean;
  title?: string;
  volumeSliderHeight?: number;
  volumeStepSize?: number;
  widthPercentage?: number;
  // Section configs
  player?: PlayerConfig;
  groups?: GroupsConfig;
  grouping?: GroupingConfig;
  volumes?: VolumesConfig;
  queue?: QueueConfig;
  mediaBrowser?: MediaBrowserConfig;
  search?: SearchConfig;
}

export interface MediaArtworkOverride {
  ifMissing?: boolean;
  mediaTitleEquals?: string;
  mediaArtistEquals?: string;
  mediaAlbumNameEquals?: string;
  mediaContentIdEquals?: string;
  mediaChannelEquals?: string;
  appNameEquals?: string;
  sourceEquals?: string;
  appIdEquals?: string;
  mediaTitleRegexp?: string;
  mediaArtistRegexp?: string;
  mediaAlbumNameRegexp?: string;
  mediaContentIdRegexp?: string;
  mediaChannelRegexp?: string;
  appNameRegexp?: string;
  sourceRegexp?: string;
  appIdRegexp?: string;
  imageUrl?: string;
  sizePercentage?: number;
}

export interface CustomFavorites {
  [name: string]: CustomFavorite[];
}

export interface CustomFavorite {
  title: string;
  thumbnail?: string;
  media_content_id?: string;
  media_content_type?: string;
  contentIdRegexpForUseAs?: string;
  useTitleAsMediaTitle?: boolean;
  useThumbnailAsArtwork?: boolean;
}

export interface CustomFavoriteThumbnails {
  [title: string]: string;
}

export interface MediaPlayerItem extends Partial<UpstreamMediaPlayerItem> {
  title: string;
  favoriteType?: string;
  queueItemId?: string; // Music Assistant queue item ID for remove/play operations
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
  media_content_type: string;
}

export interface MusicAssistantQueueItem {
  queue_item_id: string;
  name: string;
  duration: number;
  media_item: {
    media_type: string;
    uri: string;
    name: string;
    version: string;
    image: string | null;
    favorite: boolean;
    explicit: boolean;
    artists?: { name: string }[];
    album?: {
      name: string;
      image: string | null;
    };
  };
}

export interface MusicAssistantQueueResponse {
  response: {
    [entity_id: string]: {
      queue_id: string;
      active: boolean;
      name: string;
      items: number;
      shuffle_enabled: boolean;
      repeat_mode: string;
      current_index: number;
      elapsed_time: number;
      current_item: MusicAssistantQueueItem | null;
      next_item: MusicAssistantQueueItem | null;
    };
  };
}

export interface MusicAssistantQueueItemsResponse {
  response: {
    [entity_id: string]: MusicAssistantQueueItem[];
  };
}

export interface MassQueueItem {
  queue_item_id: string;
  media_title: string;
  media_album_name: string;
  media_artist: string;
  media_content_id: string;
  media_image: string | null;
  favorite: boolean;
}

export interface MassQueueResponse {
  response: {
    [entity_id: string]: MassQueueItem[];
  };
}

export const MASS_QUEUE_NOT_INSTALLED = 'MASS_QUEUE_NOT_INSTALLED';

export interface ConfigEntry {
  entry_id: string;
  domain: string;
  title: string;
  state: string;
}

export interface OperationProgress {
  current: number;
  total: number;
  label: string;
}

export type PlayMenuAction = {
  enqueue: EnqueueMode;
  radioMode?: boolean;
};

export type EnqueueMode = 'add' | 'next' | 'replace' | 'replace_next' | 'play';

export type MusicAssistantFavoritesMediaType = 'track' | 'album' | 'artist' | 'playlist' | 'radio';

export type BatchOperationFn = (onProgress: (completed: number) => void, shouldCancel: () => boolean) => Promise<void>;

export interface BatchOperationState {
  operationProgress: OperationProgress | null;
  cancelOperation: boolean;
}

export interface BatchOperationCallbacks {
  setProgress: (progress: OperationProgress | null) => void;
  onComplete?: () => void;
}
export interface ArtworkMatchAttributes {
  media_title?: string;
  media_artist?: string;
  media_album_name?: string;
  media_content_id?: string;
  media_channel?: string;
  app_name?: string;
  source?: string;
  app_id?: string;
}
