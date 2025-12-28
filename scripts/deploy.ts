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

async function updateHacstag(): Promise<void> {
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
        handleResourcesResult(msg, ws, msgId++, resolve, reject);
      } else if (msg.type === 'result' && msg.id === 2) {
        handleUpdateResult(msg, ws, resolve, reject);
      }
    });

    ws.on('error', (err: Error) => {
      console.error('WebSocket error:', err.message);
      reject(err);
    });
  });
}

function handleResourcesResult(
  msg: HaMessage,
  ws: WebSocket,
  msgId: number,
  _resolve: () => void,
  reject: (err: Error) => void,
): void {
  const resources = msg.result ?? [];
  const sonosResource = resources.find((r) => r.url?.includes('custom-sonos-card'));

  if (!sonosResource) {
    console.error('Could not find custom-sonos-card resource!');
    ws.close();
    reject(new Error('Resource not found'));
    return;
  }

  const currentUrl = sonosResource.url;
  const resourceId = sonosResource.id;

  const match = currentUrl.match(/hacstag=(\d+)/);
  if (!match) {
    console.error(`No hacstag found in URL: ${currentUrl}`);
    ws.close();
    reject(new Error('No hacstag'));
    return;
  }

  const currentTag = parseInt(match[1], 10);
  const newTag = currentTag + 1;
  const newUrl = currentUrl.replace(`hacstag=${currentTag}`, `hacstag=${newTag}`);

  console.log(`Resource ID: ${resourceId}`);
  console.log(`Current: ${currentUrl}`);
  console.log(`New: ${newUrl}`);

  ws.send(
    JSON.stringify({
      id: msgId,
      type: 'lovelace/resources/update',
      resource_id: resourceId,
      url: newUrl,
    }),
  );
}

function handleUpdateResult(msg: HaMessage, ws: WebSocket, resolve: () => void, reject: (err: Error) => void): void {
  if (msg.success) {
    console.log('\n✅ Hacstag updated successfully!');
    ws.close();
    resolve();
  } else {
    console.error('Failed to update:', msg.error);
    ws.close();
    reject(new Error('Update failed'));
  }
}

updateHacstag().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
