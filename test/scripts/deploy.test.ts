import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { connections } = vi.hoisted(() => ({
  connections: [] as Array<import('node:events').EventEmitter & { send: ReturnType<typeof vi.fn> }>,
}));

vi.mock('fs', () => ({ existsSync: () => false }));
vi.mock('ws', async () => {
  const { EventEmitter } = await import('node:events');
  return {
    default: class extends EventEmitter {
      send = vi.fn();
      close = vi.fn();

      constructor() {
        super();
        connections.push(this);
      }
    },
  };
});

const NOW = 1795033648253;

beforeEach(() => {
  vi.resetModules();
  connections.length = 0;
  vi.stubEnv('HA_URL', 'http://localhost:8123');
  vi.stubEnv('HA_TOKEN', 'test-token');
  vi.stubEnv('HA_RESOURCE_PREFIX', '/hacsfiles');
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

async function deploy(resources: { id: number; url: string }[]) {
  await import('../../scripts/deploy');
  const connection = connections[0];
  connection.emit('message', JSON.stringify({ type: 'auth_ok' }));
  connection.emit('message', JSON.stringify({ type: 'result', id: 1, success: true, result: resources }));
  connection.emit('message', JSON.stringify({ type: 'result', id: 2, success: true }));
  connection.emit('message', JSON.stringify({ type: 'result', id: 3, success: true }));
  return connection.send.mock.calls.map(([payload]) => JSON.parse(payload));
}

describe('deployment resource cache versions', () => {
  it('gives newly created resources unique timestamp versions', async () => {
    const messages = await deploy([]);
    for (const cardName of ['custom-sonos-card', 'maxi-media-player']) {
      expect(messages).toContainEqual(
        expect.objectContaining({
          type: 'lovelace/resources/create',
          url: `/hacsfiles/${cardName}/${cardName}.js?hacstag=${NOW}`,
        }),
      );
    }
  });

  it.each([1, NOW + 1000])('advances existing version %s without dropping URL parameters', async (version) => {
    const messages = await deploy([{ id: 42, url: `/hacsfiles/custom-sonos-card/custom-sonos-card.js?hacstag=${version}&custom=keep` }]);
    expect(messages).toContainEqual(
      expect.objectContaining({
        type: 'lovelace/resources/update',
        resource_id: 42,
        url: `/hacsfiles/custom-sonos-card/custom-sonos-card.js?hacstag=${Math.max(NOW, version + 1)}&custom=keep`,
      }),
    );
  });
});
