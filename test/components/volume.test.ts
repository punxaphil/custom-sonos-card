import { LitElement } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../src/components/volume';
import { CardConfig } from '../../src/types';

afterEach(() => {
  document.body.replaceChildren();
});

async function renderVolume(config: Partial<CardConfig>, initialVolume: number) {
  let volume = initialVolume;
  const element = document.createElement('sonos-volume') as LitElement;
  Object.assign(element, {
    store: { config, hidePower: () => true, mediaControlService: { volumeSet: vi.fn().mockResolvedValue(undefined) } },
    player: { getVolume: () => volume, isGroupMuted: () => false },
  });
  document.body.append(element);
  await element.updateComplete;
  const slider = element.shadowRoot!.querySelector('ha-control-slider')!;
  return { element, slider, setVolume: (value: number) => (volume = value) };
}

describe('volume threshold warning', () => {
  it.each([
    { volume: 19, max: 30, enabled: true, warning: false },
    { volume: 20, max: 30, enabled: true, warning: true },
    { volume: 21, max: 30, enabled: true, warning: true },
    { volume: 19, max: 100, enabled: true, warning: false },
    { volume: 21, max: 100, enabled: false, warning: false },
  ])('uses the threshold at volume $volume (max $max, enabled $enabled)', async ({ volume, max, enabled, warning }) => {
    const { slider } = await renderVolume({ dynamicVolumeSlider: enabled, dynamicVolumeSliderMax: max }, volume);
    expect(slider.classList.contains('over-threshold')).toBe(warning);
  });

  it('updates the warning while preserving the scale during a drag', async () => {
    const { element, slider, setVolume } = await renderVolume({ dynamicVolumeSlider: true, changeVolumeOnSlide: true }, 10);
    slider.dispatchEvent(new CustomEvent('slider-moved'));
    setVolume(25);
    element.requestUpdate();
    await element.updateComplete;
    expect(slider.getAttribute('max')).toBe('30');
    expect(slider.classList.contains('over-threshold')).toBe(true);
  });
});
