import { AllSections } from './all-sections';
import { CardConfig } from '../types'; // Deprecated: use AllSections instead

// Deprecated: use AllSections instead
export class CustomSonosCard extends AllSections {
  setConfig(config: CardConfig) {
    console.error('type: custom:custom-sonos-card is deprecated, please use custom:sonos-card instead');
    super.setConfig(config);
  }
}
