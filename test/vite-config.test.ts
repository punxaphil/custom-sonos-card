import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('vite config', () => {
  it('targets Chrome 91 for build output compatibility', () => {
    const viteConfigPath = resolve(__dirname, '../vite.config.mjs');
    const viteConfig = readFileSync(viteConfigPath, 'utf8');
    expect(viteConfig).toContain("target: 'chrome91'");
  });
});
