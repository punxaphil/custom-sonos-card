import { html } from 'lit';
import Store from '../model/store';
import { MediaPlayerEntityFeature } from '../types';
import { StyleInfo, styleMap } from 'lit-html/directives/style-map.js';

export function haPlayer(store: Store, features: MediaPlayerEntityFeature[], additionalStyle: StyleInfo = {}) {
  const state = store.hass.states[store.activePlayer.id];
  let supportedFeatures = 0;
  features.forEach((feature) => (supportedFeatures += feature));

  const playerState = {
    ...state,
    attributes: { ...state.attributes, supported_features: supportedFeatures },
  };
  return html`
    <more-info-content
      .stateObj=${playerState}
      .hass=${store.hass}
      style="${styleMap(additionalStyle)}"
    ></more-info-content>
  `;
}
