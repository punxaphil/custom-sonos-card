import { LovelaceCardConfig } from 'custom-card-helpers';
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

export interface CardConfig extends LovelaceCardConfig {
  sections?: Section[];
  showVolumeUpAndDownButtons: boolean;
  entities?: string[];
  predefinedGroups?: ConfigPredefinedGroup[];
  title?: string;
  labelWhenNoMediaIsSelected?: string;
  labelForTheAllVolumesSlider: string;
  entityNameRegexToReplace?: string;
  entityNameReplacement?: string;
  artworkHostname?: string;
  widthPercentage?: number;
  heightPercentage?: number;
  hideGroupCurrentTrack: boolean;
  dynamicVolumeSlider: boolean;
  mediaArtworkOverrides?: MediaArtworkOverride[];
  customSources?: CustomSources;
  customThumbnailIfMissing?: CustomThumbnail;
  mediaBrowserTitlesToIgnore?: string[];
  mediaBrowserItemsPerRow: number;
  mediaBrowserShowTitleForThumbnailIcons?: boolean;
  volumeRatios?: VolumeRatio[];
}

export interface MediaArtworkOverride {
  ifMissing?: boolean;
  mediaTitleEquals?: string;
  mediaContentIdEquals?: string;
  imageUrl?: string;
}

export interface CustomSources {
  [name: string]: CustomSource[];
}

export interface CustomSource {
  title: string;
  thumbnail?: string;
}

export interface CustomThumbnail {
  [title: string]: string;
}

export interface MediaPlayerItem {
  title: string;
  thumbnail?: string;
  children?: MediaPlayerItem[];
  media_class?: string;
  can_expand?: boolean;
  can_play?: boolean;
  media_content_type?: string;
  media_content_id?: string;
  showFolderIcon?: boolean;
}

export interface ConfigPredefinedGroup {
  name: string;
  entities: (string | ConfigPredefinedGroupPlayer)[];
}

export interface ConfigPredefinedGroupPlayer {
  id: string;
  volume?: number;
}

export interface PredefinedGroup {
  name: string;
  entities: PredefinedGroupPlayer[];
}

export interface PredefinedGroupPlayer {
  player: MediaPlayer;
  volume?: number;
}
export interface VolumeRatio {
  basePlayer: string;
  adjustedPlayer: string;
  ratio: number;
}

export interface TemplateResult {
  result: string[];
}
