import { afterEach, describe, expect, it } from 'vitest';
import '../../src/sections/player/player-controls';

function createStore(hideControlFavoriteButton?: boolean) {
  return {
    config: { player: hideControlFavoriteButton ? { hideControlFavoriteButton: true } : {} },
    activePlayer: {
      attributes: { media_position: 0, media_content_id: 'track-1' },
      isPlaying: () => false,
      isOn: () => false,
      getMember: () => undefined,
    },
    allMediaPlayers: [],
    hidePower: () => true,
    hassService: {
      musicAssistantService: {
        isMusicAssistantPlayer: () => false,
      },
    },
  };
}

describe('player controls favorite button visibility', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function renderElement(hideControlFavoriteButton?: boolean) {
    const element = document.createElement('sonos-player-controls') as HTMLElement & { store: unknown; updateComplete: Promise<void> };
    element.store = createStore(hideControlFavoriteButton);
    document.body.appendChild(element);
    await element.updateComplete;
    return element;
  }

  it('shows favorite button by default', async () => {
    const element = await renderElement();
    const favoriteButton = element.shadowRoot?.querySelector('sonos-player-favorite-button');
    expect(favoriteButton?.hasAttribute('hidden')).toBe(false);
  });

  it('hides favorite button when hideControlFavoriteButton is enabled', async () => {
    const element = await renderElement(true);
    const favoriteButton = element.shadowRoot?.querySelector('sonos-player-favorite-button');
    expect(favoriteButton?.hasAttribute('hidden')).toBe(true);
  });
});
