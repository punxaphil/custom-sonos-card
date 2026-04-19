import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { loadConfigFromFile } from 'vite';

describe('vite config', () => {
  it('targets Chrome 91 for build output compatibility', async () => {
    const viteConfigPath = resolve(__dirname, '../vite.config.mjs');
    const loadedConfig = await loadConfigFromFile({ command: 'build', mode: 'production' }, viteConfigPath);
    expect(loadedConfig?.config.build?.target).toBe('chrome91');
  });
});
