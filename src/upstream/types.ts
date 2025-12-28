// @ts-nocheck
import type { HomeAssistant as HAHomeAssistant } from 'custom-card-helpers';

export type HomeAssistant = HAHomeAssistant;

export interface TranslationDict {
    [key: string]: string | TranslationDict;
}
