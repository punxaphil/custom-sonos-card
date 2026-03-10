import { beforeEach, describe, expect, it } from 'vitest';
import { HassEntity } from 'home-assistant-js-websocket';
import { CardConfig } from '../../src/types';
import { MediaPlayer } from '../../src/model/media-player';
import { newConfig } from '../utils/utils.test';

describe('MediaPlayer', () => {
  let hassEntity1: HassEntity;
  let hassEntity2: HassEntity;
  let config: CardConfig;
  let mediaPlayer: MediaPlayer;

  function initMediaPlayer(groupSize: number, inverseGroupMuteState = false) {
    hassEntity1 = {
      entity_id: 'media_player.first',
      state: 'playing',
      attributes: {
        friendly_name: 'Test Player',
        is_volume_muted: false,
        media_artist: 'Artist',
        media_title: 'Title',
        media_content_id: 'http://example.com',
        volume_level: 0.5,
        group_members: ['media_player.first', 'media_player.second'],
      },
    } as unknown as HassEntity;
    hassEntity2 = {
      entity_id: 'media_player.second',
      attributes: {
        friendly_name: 'Second Player',
      },
    } as unknown as HassEntity;

    config = newConfig({
      entitiesToIgnoreVolumeLevelFor: ['media_player.ignore'],
      mediaTitleRegexToReplace: 'Title',
      mediaTitleReplacement: 'Replaced Title',
      adjustVolumeRelativeToMainPlayer: true,
      inverseGroupMuteState: inverseGroupMuteState,
    });
    hassEntity1.attributes.group_members.length = groupSize;
    mediaPlayer = new MediaPlayer(hassEntity1, config, [hassEntity1, hassEntity2]);
  }

  beforeEach(() => {
    initMediaPlayer(1);
  });

  it('should initialize correctly', () => {
    expect(mediaPlayer.id).toBe('media_player.first');
    expect(mediaPlayer.state).toBe('playing');
    expect(mediaPlayer.attributes).toBe(hassEntity1.attributes);
    expect(mediaPlayer.members).toEqual([mediaPlayer]);
    expect(mediaPlayer.volumePlayer).toBe(mediaPlayer);
    expect(mediaPlayer.ignoreVolume).toBe(false);
  });

  it('should get member correctly', () => {
    expect(mediaPlayer.getMember('media_player.first')).toEqual(mediaPlayer);
    expect(mediaPlayer.getMember('non_existent')).toBeUndefined();
  });

  it('should check if has member correctly', () => {
    expect(mediaPlayer.hasMember('media_player.first')).toBe(true);
    expect(mediaPlayer.hasMember('non_existent')).toBe(false);
  });

  it('should check if is playing correctly', () => {
    expect(mediaPlayer.isPlaying()).toBe(true);
    mediaPlayer.state = 'paused';
    expect(mediaPlayer.isPlaying()).toBe(false);
  });

  it('should check if member is muted correctly', () => {
    expect(mediaPlayer.isMemberMuted()).toBe(false);
    mediaPlayer.attributes.is_volume_muted = true;
    expect(mediaPlayer.isMemberMuted()).toBe(true);
  });

  it('should check if group is muted correctly', () => {
    initMediaPlayer(2);
    expect(mediaPlayer.isGroupMuted()).toBe(false);
    mediaPlayer.members[1].attributes.is_volume_muted = true;
    expect(mediaPlayer.isGroupMuted()).toBe(false);
    mediaPlayer.members.forEach((member) => (member.attributes.is_volume_muted = true));
    expect(mediaPlayer.isGroupMuted()).toBe(true);
    initMediaPlayer(2, true);
    mediaPlayer.members[1].attributes.is_volume_muted = true;
    expect(mediaPlayer.isGroupMuted()).toBe(true);
  });

  it('should get current track correctly', () => {
    expect(mediaPlayer.getCurrentTrack()).toBe('Artist - Replaced Title');
    mediaPlayer.attributes.media_artist = '';
    mediaPlayer.attributes.media_title = '';
    expect(mediaPlayer.getCurrentTrack()).toBe('example.com');
    mediaPlayer.attributes.media_title = 'chimes.wav?skip=10';
    config.mediaTitleRegexToReplace = '.wav?.*';
    config.mediaTitleReplacement = ' radio';
    expect(mediaPlayer.getCurrentTrack()).toBe('chimes radio');
  });

  it('should use custom favorite title when useTitleAsMediaTitle is true', () => {
    config.mediaBrowser = {
      favorites: {
        customFavorites: {
          all: [
            {
              title: 'My Radio Station',
              media_content_id: 'http://example.com',
              useTitleAsMediaTitle: true,
            },
          ],
        },
      },
    };
    mediaPlayer = new MediaPlayer(hassEntity1, config);
    expect(mediaPlayer.getCurrentTrack()).toBe('My Radio Station');
  });

  it('should not use custom favorite title when useTitleAsMediaTitle is false', () => {
    config.mediaBrowser = {
      favorites: {
        customFavorites: {
          all: [
            {
              title: 'My Radio Station',
              media_content_id: 'http://example.com',
              useTitleAsMediaTitle: false,
            },
          ],
        },
      },
    };
    mediaPlayer = new MediaPlayer(hassEntity1, config);
    expect(mediaPlayer.getCurrentTrack()).toBe('Artist - Replaced Title');
  });

  it('should not use custom favorite title when media_content_id does not match', () => {
    config.mediaBrowser = {
      favorites: {
        customFavorites: {
          all: [
            {
              title: 'My Radio Station',
              media_content_id: 'http://other.com',
              useTitleAsMediaTitle: true,
            },
          ],
        },
      },
    };
    mediaPlayer = new MediaPlayer(hassEntity1, config);
    expect(mediaPlayer.getCurrentTrack()).toBe('Artist - Replaced Title');
  });

  it('should get entity name correctly', () => {
    expect(mediaPlayer.name).toBe('Test Player');
    config.entityNameRegexToReplace = 'Player';
    config.entityNameReplacement = 'Replaced Player';
    mediaPlayer = new MediaPlayer(hassEntity1, config);
    expect(mediaPlayer.name).toBe('Test Replaced Player');
  });

  it('should determine volume player correctly', () => {
    expect(mediaPlayer.volumePlayer).toBe(mediaPlayer);
    config.entitiesToIgnoreVolumeLevelFor = ['media_player.first'];
    hassEntity1.attributes.group_members = ['media_player.first', 'media_player.second'];
    mediaPlayer = new MediaPlayer(hassEntity1, config, [hassEntity1, hassEntity2]);
    expect(mediaPlayer.volumePlayer.name).toBe('Second Player');
  });

  it('should get volume correctly', () => {
    expect(mediaPlayer.getVolume()).toBe(50);
    mediaPlayer.members.push(new MediaPlayer(hassEntity1, config));
    expect(mediaPlayer.getVolume()).toBe(50);
    mediaPlayer.attributes.volume_level = undefined;
    expect(mediaPlayer.getVolume()).toBe(0);
  });
});
