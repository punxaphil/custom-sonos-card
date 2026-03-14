import Store from '../../model/store';
import { getGroupPlayerIds } from '../../utils/utils';
import { GroupingItem } from '../../model/grouping-item';

const SYNC_POLL_INTERVAL = 500;
const SYNC_TIMEOUT = 30_000;

export function buildGroupingItems(store: Store, modifiedItems: string[]): GroupingItem[] {
  const items = store.allMediaPlayers.map((player) => new GroupingItem(player, store.activePlayer, modifiedItems.includes(player.id)));
  const selected = items.filter((item) => item.isSelected);
  if (selected.length === 1) {
    selected[0].isDisabled = true;
  }
  if (store.config.grouping?.disableMainSpeakers) {
    const mainIds = store.allGroups.filter((p) => p.members.length > 1).map((p) => p.id);
    items.forEach((item) => {
      if (mainIds.includes(item.player.id)) {
        item.isDisabled = true;
      }
    });
  }
  if (!store.config.grouping?.dontSortMembersOnTop) {
    items.sort((a, b) => {
      if (a.isMain) {
        return -1;
      }
      if (b.isMain) {
        return 1;
      }
      if (a.currentlyJoined !== b.currentlyJoined) {
        return a.currentlyJoined ? -1 : 1;
      }
      return 0;
    });
  }
  return items;
}

export function waitForGroupSync(getStore: () => Store, mainPlayerId: string, expectedIds: string[]): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      clearInterval(poll);
      resolve();
    }, SYNC_TIMEOUT);
    const poll = setInterval(() => {
      const mainEntity = getStore().hass.states[mainPlayerId];
      if (mainEntity) {
        const actualIds = getGroupPlayerIds(mainEntity).sort();
        if (actualIds.length === expectedIds.length && actualIds.every((id, i) => id === expectedIds[i])) {
          clearInterval(poll);
          clearTimeout(timeout);
          resolve();
        }
      }
    }, SYNC_POLL_INTERVAL);
  });
}
