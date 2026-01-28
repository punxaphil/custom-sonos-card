// @ts-nocheck
import { LitVirtualizer } from '@lit-labs/virtualizer/LitVirtualizer.js';

// Only register if not already defined (HA might have it already)
if (!customElements.get('lit-virtualizer')) {
    customElements.define('lit-virtualizer', LitVirtualizer);
}

export const loadVirtualizer = async (): Promise<void> => {
    // Element is registered above via static import
};
