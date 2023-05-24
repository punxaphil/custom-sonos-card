import { LovelaceCardConfig } from 'custom-card-helpers';

declare global {
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
  entities?: string[];
  predefinedGroups?: PredefinedGroup[];
  name?: string;
  labelWhenNoMediaIsSelected?: string;
  labelForTheAllVolumesSlider: string;
  entityNameRegexToReplace?: string;
  entityNameReplacement?: string;
  artworkHostname?: string;
  widthPercentage?: number;
  shuffleFavorites?: boolean;
  hideGroupCurrentTrack: boolean;
  dynamicVolumeSlider: boolean;
  mediaArtworkOverrides?: MediaArtworkOverride[];

  customSources?: CustomSources;
  customThumbnailIfMissing?: CustomThumbnail;
  mediaBrowserTitlesToIgnore?: string[];
}

export interface Layout {
  mobileThresholdPx?: string;
  groups?: Size;
  players?: Size;
  mediaBrowser?: Size;
  mediaItem?: Size;
  // deprecated
  favorites?: Size;
  // deprecated
  favorite?: Size;
}

export interface Size {
  width?: string;
  mobileWidth?: string;
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

export interface PlayerGroups {
  [name: string]: PlayerGroup;
}

export interface Members {
  [name: string]: string;
}

export interface CustomThumbnail {
  [title: string]: string;
}

export interface PlayerGroup {
  entity: string;
  state: string;
  roomName: string;
  members: Members;
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
}

export interface PredefinedGroup {
  name: string;
  entities: string[];
}

export interface TemplateResult {
  result: string[];
}
