#!/usr/bin/env npx tsx
import * as fs from 'fs';
import * as path from 'path';
import WebSocket from 'ws';

interface EnvConfig {
  HA_URL?: string;
  [key: string]: string | undefined;
}

interface HaMessage {
  type: string;
  id?: number;
  message?: string;
  result?: Resource[];
  success?: boolean;
  error?: unknown;
}

interface Resource {
  id: number;
  url: string;
}

function loadEnv(): EnvConfig {
  const envPath = path.join(__dirname, '..', '.env');
  const env: EnvConfig = {};
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8')
      .split('\n')
      .forEach((line) => {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          env[key.trim()] = valueParts.join('=').trim();
        }
      });
  }
  return env;
}

function loadToken(env: EnvConfig): string | null {
  return env.HA_TOKEN?.trim() || null;
}

const CARD_NAMES = ['custom-sonos-card', 'maxi-media-player'];

async function updateHacstags(): Promise<void> {
  const env = loadEnv();
  const token = loadToken(env);

  if (!token) {
    console.error('No HA_TOKEN found in .env file. Run deploy.sh first to set up token.');
    process.exit(1);
  }

  if (!env.HA_URL) {
    console.error('HA_URL not found in .env file.');
    process.exit(1);
  }

  const haUrl = env.HA_URL.replace('https://', 'wss://').replace('http://', 'ws://');
  const wsUrl = `${haUrl}/api/websocket`;

  console.log(`Connecting to ${wsUrl}...`);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    let pendingUpdates: { resourceId: number; currentUrl: string; newUrl: string; cardName: string }[] = [];
    let completedUpdates = 0;

    ws.on('message', (data: WebSocket.Data) => {
      const msg: HaMessage = JSON.parse(data.toString());

      if (msg.type === 'auth_required') {
        ws.send(JSON.stringify({ type: 'auth', access_token: token }));
      } else if (msg.type === 'auth_ok') {
        console.log('Authenticated!');
        ws.send(JSON.stringify({ id: msgId++, type: 'lovelace/resources' }));
      } else if (msg.type === 'auth_invalid') {
        console.error('Auth failed:', msg.message);
        ws.close();
        reject(new Error('Auth failed'));
      } else if (msg.type === 'result' && msg.id === 1) {
        pendingUpdates = buildUpdates(msg, reject);
        if (pendingUpdates.length === 0) {
          ws.close();
          reject(new Error('No resources found to update'));
          return;
        }
        for (const update of pendingUpdates) {
          const id = msgId++;
          console.log(`\n[${update.cardName}]`);
          console.log(`  Resource ID: ${update.resourceId}`);
          console.log(`  Current: ${update.currentUrl}`);
          console.log(`  New: ${update.newUrl}`);
          ws.send(
            JSON.stringify({
              id,
              type: 'lovelace/resources/update',
              resource_id: update.resourceId,
              url: update.newUrl,
            }),
          );
        }
      } else if (msg.type === 'result' && msg.id && msg.id >= 2) {
        if (msg.success) {
          completedUpdates++;
          if (completedUpdates === pendingUpdates.length) {
            console.log(`\n✅ All ${completedUpdates} hacstags updated successfully!`);
            ws.close();
            resolve();
          }
        } else {
          console.error('Failed to update:', msg.error);
          ws.close();
          reject(new Error('Update failed'));
        }
      }
    });

    ws.on('error', (err: Error) => {
      console.error('WebSocket error:', err.message);
      reject(err);
    });
  });
}

function buildUpdates(msg: HaMessage, reject: (err: Error) => void): { resourceId: number; currentUrl: string; newUrl: string; cardName: string }[] {
  const resources = msg.result ?? [];
  const updates: { resourceId: number; currentUrl: string; newUrl: string; cardName: string }[] = [];

  for (const cardName of CARD_NAMES) {
    const resource = resources.find((r) => r.url?.includes(cardName));

    if (!resource) {
      console.error(`Could not find ${cardName} resource!`);
      reject(new Error(`Resource not found: ${cardName}`));
      return [];
    }

    const match = resource.url.match(/hacstag=(\d+)/);
    if (!match) {
      console.error(`No hacstag found in URL: ${resource.url}`);
      reject(new Error(`No hacstag for ${cardName}`));
      return [];
    }

    const currentTag = parseInt(match[1], 10);
    const newTag = currentTag + 1;
    const newUrl = resource.url.replace(`hacstag=${currentTag}`, `hacstag=${newTag}`);

    updates.push({ resourceId: resource.id, currentUrl: resource.url, newUrl, cardName });
  }

  return updates;
}

updateHacstags().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
