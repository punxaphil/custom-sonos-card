// @ts-nocheck
import type { HomeAssistant } from 'custom-card-helpers';

export interface BrandsUrlOptions {
    domain: string;
    type: string;
    useFallback?: boolean;
    darkOptimized?: boolean;
}

export const brandsUrl = (options: BrandsUrlOptions): string => {
    const { domain, type, useFallback = true, darkOptimized = false } = options;
    return `https://brands.home-assistant.io/${useFallback ? '_/' : ''}${domain}/${darkOptimized ? 'dark_' : ''}${type}.png`;
};

export const isBrandUrl = (url?: string): boolean => {
    return url?.startsWith('https://brands.home-assistant.io/') ?? false;
};

export const extractDomainFromBrandUrl = (url: string): string => {
    const match = url.match(/brands\.home-assistant\.io\/[^/]+\/([^/]+)\//);
    return match?.[1] ?? '';
};
