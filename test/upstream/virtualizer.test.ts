import { describe, expect, it } from 'vitest';

describe('card virtualizer registration', () => {
  it('leaves Home Assistant free to register its own lit-virtualizer', async () => {
    await import('../../src/upstream/resources/virtualizer');

    expect(customElements.get('lit-virtualizer')).toBeUndefined();
    expect(customElements.get('sonos-lit-virtualizer')).toBeDefined();

    class HomeAssistantVirtualizer extends HTMLElement {}
    customElements.define('lit-virtualizer', HomeAssistantVirtualizer);

    expect(customElements.get('lit-virtualizer')).toBe(HomeAssistantVirtualizer);
    expect(document.createElement('sonos-lit-virtualizer')).toBeInstanceOf(customElements.get('sonos-lit-virtualizer')!);
  });
});
