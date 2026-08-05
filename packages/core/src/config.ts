import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { LoilonoteConfig } from './types.js';

const DEFAULT_CONFIG: LoilonoteConfig = {
  version: 1,
  auth: {
    token: null,
    tokenFile: null,
  },
  server: {
    baseUrl: 'https://n.loilo.tv',
    timeout: 30000,
  },
  cli: {
    outputFormat: 'table',
    colorEnabled: true,
  },
};

function configDir(): string {
  const envPath = process.env.LOILONOTE_CONFIG_PATH;
  if (envPath) return envPath;
  return join(homedir(), '.loilonote');
}

function configPath(): string {
  return join(configDir(), 'config.json');
}

export function loadConfig(): LoilonoteConfig {
  const path = configPath();
  if (!existsSync(path)) return { ...DEFAULT_CONFIG };
  try {
    const raw = readFileSync(path, 'utf-8');
    const user = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...user,
      auth: { ...DEFAULT_CONFIG.auth, ...user.auth },
      server: { ...DEFAULT_CONFIG.server, ...user.server },
      cli: { ...DEFAULT_CONFIG.cli, ...user.cli },
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: LoilonoteConfig): void {
  const dir = configDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(configPath(), JSON.stringify(config, null, 2), 'utf-8');
}

let _tokenCache: string | null | undefined = undefined; // undefined = 尚未初始化

export function getToken(): string | null {
  const envToken = process.env.LOILONOTE_TOKEN;
  if (envToken) return envToken;
  if (_tokenCache !== undefined) return _tokenCache;
  const config = loadConfig();
  if (config.auth.token) { _tokenCache = config.auth.token; return _tokenCache; }
  if (config.auth.tokenFile) {
    try {
      _tokenCache = readFileSync(config.auth.tokenFile, 'utf-8').trim();
      return _tokenCache;
    } catch {
      _tokenCache = null;
      return null;
    }
  }
  _tokenCache = null;
  return null;
}

export function updateToken(token: string): void {
  _tokenCache = token; // 同步更新快取
  const config = loadConfig();
  config.auth.token = token;
  saveConfig(config);
}
