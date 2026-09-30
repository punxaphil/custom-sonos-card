// @ts-nocheck
import { LitVirtualizer } from '@lit-labs/virtualizer/LitVirtualizer.js';

if (!customElements.get('sonos-lit-virtualizer')) {
    customElements.define('sonos-lit-virtualizer', LitVirtualizer);
}

export const loadVirtualizer = async (): Promise<void> => {
};
