import { describe, expect, it } from 'vitest';
import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { MediaPlayer } from '../../src/model/media-player';
import { getAllMediaPlayers, getGroupMemberCandidates, isGroupPlayer } from '../../src/utils/group-member-utils';
import { newConfig } from './utils.test';

const SYNC_GROUP_ID = 'media_player.downstairs';
const KITCHEN_ID = 'media_player.kitchen';
const LIVING_ROOM_ID = 'media_player.living_room';

const entity = (entityId: string, groupMembers?: string[]): HassEntity =>
  ({ entity_id: entityId, state: 'playing', attributes: { friendly_name: entityId, group_members: groupMembers } }) as unknown as HassEntity;

const kitchen = entity(KITCHEN_ID);
const livingRoom = entity(LIVING_ROOM_ID);
const syncGroup = entity(SYNC_GROUP_ID, [LIVING_ROOM_ID, KITCHEN_ID]);
const hass = { states: { [KITCHEN_ID]: kitchen, [LIVING_ROOM_ID]: livingRoom, [SYNC_GROUP_ID]: syncGroup } } as unknown as HomeAssistant;
const enabled = newConfig({ allowGroupMembersOutsideOfEntities: true });
const disabled = newConfig({});

describe('isGroupPlayer', () => {
  it('is true when the player is not part of its own group members', () => {
    expect(isGroupPlayer(syncGroup)).toBe(true);
  });

  it.each([[[KITCHEN_ID, LIVING_ROOM_ID]], [[]], [undefined]])('is false for group members %j', (groupMembers) => {
    expect(isGroupPlayer(entity(KITCHEN_ID, groupMembers))).toBe(false);
  });
});

describe('getGroupMemberCandidates', () => {
  it('returns the configured entities when the option is not enabled', () => {
    const configured = [syncGroup];
    expect(getGroupMemberCandidates(disabled, hass, syncGroup, configured)).toBe(configured);
  });

  it('returns the configured entities for players that are not group players', () => {
    const regular = entity(KITCHEN_ID, [KITCHEN_ID, LIVING_ROOM_ID]);
    const configured = [regular];
    expect(getGroupMemberCandidates(enabled, hass, regular, configured)).toBe(configured);
  });

  it('resolves group player members from all states when enabled', () => {
    expect(getGroupMemberCandidates(enabled, hass, syncGroup, [syncGroup])).toEqual([livingRoom, kitchen]);
  });

  it('skips group player members without a state', () => {
    const group = entity(SYNC_GROUP_ID, [KITCHEN_ID, 'media_player.removed']);
    expect(getGroupMemberCandidates(enabled, hass, group, [group])).toEqual([kitchen]);
  });
});

describe('MediaPlayer members of a group player', () => {
  const members = (config = disabled) => new MediaPlayer(syncGroup, config, [syncGroup], hass).members.map((member) => member.id);

  it('only uses configured entities when the option is not enabled', () => {
    expect(members()).toEqual([]);
  });

  it('includes members outside of the configured entities when enabled', () => {
    expect(members(enabled)).toEqual([LIVING_ROOM_ID, KITCHEN_ID]);
  });
});

describe('getAllMediaPlayers', () => {
  const groups = [new MediaPlayer(syncGroup, enabled, [syncGroup], hass), new MediaPlayer(kitchen, enabled, [kitchen], hass)];

  it('keeps every group member when the option is not enabled', () => {
    expect(getAllMediaPlayers(groups, disabled).map((player) => player.id)).toEqual([LIVING_ROOM_ID, KITCHEN_ID, KITCHEN_ID]);
  });

  it('lists each player once when enabled', () => {
    expect(getAllMediaPlayers(groups, enabled).map((player) => player.id)).toEqual([LIVING_ROOM_ID, KITCHEN_ID]);
  });
});
