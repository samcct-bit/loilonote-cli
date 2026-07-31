import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
const DEFAULT_CONFIG = {
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
function configDir() {
    const envPath = process.env.LOILONOTE_CONFIG_PATH;
    if (envPath)
        return envPath;
    return join(homedir(), '.loilonote');
}
function configPath() {
    return join(configDir(), 'config.json');
}
export function loadConfig() {
    const path = configPath();
    if (!existsSync(path))
        return { ...DEFAULT_CONFIG };
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
    }
    catch {
        return { ...DEFAULT_CONFIG };
    }
}
export function saveConfig(config) {
    const dir = configDir();
    if (!existsSync(dir))
        mkdirSync(dir, { recursive: true });
    writeFileSync(configPath(), JSON.stringify(config, null, 2), 'utf-8');
}
export function getToken() {
    const envToken = process.env.LOILONOTE_TOKEN;
    if (envToken)
        return envToken;
    const config = loadConfig();
    if (config.auth.token)
        return config.auth.token;
    if (config.auth.tokenFile) {
        try {
            return readFileSync(config.auth.tokenFile, 'utf-8').trim();
        }
        catch {
            return null;
        }
    }
    return null;
}
export function updateToken(token) {
    const config = loadConfig();
    config.auth.token = token;
    saveConfig(config);
}
//# sourceMappingURL=config.js.map