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
  return process.env.HA_TOKEN?.trim() || env.HA_TOKEN?.trim() || null;
}

interface ResourceUpdate {
  action: 'update';
  cardName: string;
  resourceId: number;
  currentUrl: string;
  newUrl: string;
}

interface ResourceCreate {
  action: 'create';
  cardName: string;
  url: string;
}

type ResourceOperation = ResourceUpdate | ResourceCreate;

const CARD_NAMES = ['custom-sonos-card', 'maxi-media-player'];

async function updateHacstags(): Promise<void> {
  const env = loadEnv();
  const token = loadToken(env);

  if (!token) {
    console.error('No HA_TOKEN found in .env file. Run deploy.sh first to set up token.');
    process.exit(1);
  }

  const haUrlRaw = process.env.HA_URL?.trim() || env.HA_URL?.trim();
  if (!haUrlRaw) {
    console.error('HA_URL not found in .env file.');
    process.exit(1);
  }

  const haUrl = haUrlRaw.replace('https://', 'wss://').replace('http://', 'ws://');
  const wsUrl = `${haUrl}/api/websocket`;

  console.log(`Connecting to ${wsUrl}...`);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    let operations: ResourceOperation[] = [];
    let completedOps = 0;

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
        operations = buildOperations(msg);
        if (operations.length === 0) {
          console.log('\n⚠️  No resources to update — done.');
          ws.close();
          resolve();
          return;
        }
        for (const op of operations) {
          const id = msgId++;
          if (op.action === 'update') {
            console.log(`\n[${op.cardName}] update`);
            console.log(`  Resource ID: ${op.resourceId}`);
            console.log(`  Current: ${op.currentUrl}`);
            console.log(`  New: ${op.newUrl}`);
            ws.send(
              JSON.stringify({
                id,
                type: 'lovelace/resources/update',
                resource_id: op.resourceId,
                url: op.newUrl,
              }),
            );
          } else {
            console.log(`\n[${op.cardName}] create`);
            console.log(`  URL: ${op.url}`);
            ws.send(
              JSON.stringify({
                id,
                type: 'lovelace/resources/create',
                res_type: 'module',
                url: op.url,
              }),
            );
          }
        }
      } else if (msg.type === 'result' && msg.id && msg.id >= 2) {
        if (msg.success) {
          completedOps++;
          if (completedOps === operations.length) {
            console.log(`\n✅ All ${completedOps} resource operations completed successfully!`);
            ws.close();
            resolve();
          }
        } else {
          console.error('Failed:', msg.error);
          ws.close();
          reject(new Error('Resource operation failed'));
        }
      }
    });

    ws.on('error', (err: Error) => {
      console.error('WebSocket error:', err.message);
      reject(err);
    });
  });
}

function buildOperations(msg: HaMessage): ResourceOperation[] {
  const resources = msg.result ?? [];
  const operations: ResourceOperation[] = [];
  const resourcePrefix = process.env.HA_RESOURCE_PREFIX?.trim() || '/hacsfiles';

  for (const cardName of CARD_NAMES) {
    const resource = resources.find((r) => r.url?.includes(cardName));

    if (!resource) {
      const url = `${resourcePrefix}/${cardName}/${cardName}.js?hacstag=1`;
      console.log(`Resource for ${cardName} not found — will create it`);
      operations.push({ action: 'create', cardName, url });
      continue;
    }

    const match = resource.url.match(/hacstag=(\d+)/);
    if (!match) {
      console.warn(`⚠️  No hacstag found in URL for ${cardName}: ${resource.url} — skipping`);
      continue;
    }

    const currentTag = parseInt(match[1], 10);
    const newTag = currentTag + 1;
    let newUrl = resource.url.replace(`hacstag=${currentTag}`, `hacstag=${newTag}`);

    // Fix resource prefix if it doesn't match the expected one
    const expectedPath = `${resourcePrefix}/${cardName}/${cardName}.js`;
    if (!newUrl.startsWith(expectedPath)) {
      newUrl = `${expectedPath}?hacstag=${newTag}`;
    }

    operations.push({ action: 'update', cardName, resourceId: resource.id, currentUrl: resource.url, newUrl });
  }

  return operations;
}

updateHacstags().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
