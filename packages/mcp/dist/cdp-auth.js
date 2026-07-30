import { spawn, execSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
// Node.js 22+ has native WebSocket
const WebSocketConstructor = globalThis.WebSocket;
if (!WebSocketConstructor) {
    throw new Error('需要 Node.js 22+ 的原生 WebSocket 支援');
}
function findChromePath() {
    if (process.platform === 'win32') {
        const paths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
        ];
        for (const p of paths) {
            try {
                execSync(`"${p}" --version`, { stdio: 'ignore' });
                return p;
            }
            catch { /* continue */ }
        }
    }
    else if (process.platform === 'darwin') {
        return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }
    return 'google-chrome';
}
function startChrome(port) {
    const chromePath = findChromePath();
    const userDataDir = `${process.env.TEMP || '/tmp'}/loilonote-chrome-${randomInt(10000, 99999)}`;
    return spawn(chromePath, [
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${userDataDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=800,600',
        'https://loilonote.app/login',
    ], {
        detached: true,
        stdio: 'ignore',
    });
}
async function getCdpEndpoint(port) {
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
            const res = await fetch(`http://127.0.0.1:${port}/json/list`);
            if (!res.ok)
                continue;
            const data = await res.json();
            const page = data.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
            if (page?.webSocketDebuggerUrl)
                return page.webSocketDebuggerUrl;
        }
        catch { /* retry */ }
    }
    throw new Error('無法連接到 Chrome DevTools Protocol');
}
export async function loginWithBrowser() {
    const port = randomInt(9222, 9999);
    const chromeProc = startChrome(port);
    try {
        const wsUrl = await getCdpEndpoint(port);
        const ws = new WebSocketConstructor(wsUrl);
        const tokenPromise = new Promise((resolve, reject) => {
            let msgId = 0;
            let pollTimer = null;
            const send = (method, params) => {
                ws.send(JSON.stringify({ id: ++msgId, method, params }));
            };
            const stop = () => {
                if (pollTimer) {
                    clearInterval(pollTimer);
                    pollTimer = null;
                }
                try {
                    ws.close();
                }
                catch { /* ignore */ }
            };
            ws.onopen = () => {
                send('Runtime.enable');
                send('Network.enable');
                send('Page.enable');
            };
            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data.toString());
                    // 1. Capture auth_token from network requests
                    if (msg.method === 'Network.requestWillBeSent') {
                        const req = msg.params?.request;
                        const m = req?.url?.match(/auth_token=([A-Za-z0-9_-]{10,})/);
                        if (m) {
                            stop();
                            resolve(m[1]);
                            return;
                        }
                        // Check headers for Bearer token
                        const authHeader = req?.headers?.['Authorization'] || req?.headers?.['authorization'];
                        if (authHeader && authHeader.startsWith('Bearer ')) {
                            const token = authHeader.substring(7);
                            if (token.length > 10) {
                                stop();
                                resolve(token);
                                return;
                            }
                        }
                    }
                    // 2. Page loaded → inject interceptor
                    if (msg.method === 'Page.loadEventFired' || msg.method === 'Runtime.executionContextCreated') {
                        send('Runtime.evaluate', {
                            expression: `
                if(!window.__loilotoken_hook){
                  window.__loilotoken_hook=1;
                  const f=window.fetch;window.fetch=function(...a){
                    const u=a[0]&&typeof a[0]==='string'?a[0]:a[0]&&a[0].url||'';
                    const m=u.match(/auth_token=([A-Za-z0-9_-]{10,})/);
                    if(m)window.__loilotoken=m[1];
                    return f.apply(this,a)
                  };
                  const o=XMLHttpRequest.prototype.open;
                  XMLHttpRequest.prototype.open=function(m,u){
                    const x=(u||'').match(/auth_token=([A-Za-z0-9_-]{10,})/);
                    if(x)window.__loilotoken=x[1];
                    return o.apply(this,arguments)
                  };
                }
              `,
                        });
                        // Poll for token
                        if (!pollTimer) {
                            pollTimer = setInterval(() => {
                                send('Runtime.evaluate', {
                                    expression: `(() => {
                    if (window.__loilotoken) return window.__loilotoken;
                    try {
                      const m = document.cookie.match(/(?:auth_token|token)=([A-Za-z0-9_-]{10,})/);
                      if (m) return m[1];
                      for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        const v = localStorage.getItem(k);
                        if (v && v.length > 15 && v.length < 100 && (k.includes('token') || k === 'auth')) {
                          try {
                            const parsed = JSON.parse(v);
                            if (parsed.token || parsed.auth_token || parsed.accessToken) return parsed.token || parsed.auth_token || parsed.accessToken;
                          } catch(e) {
                            return v;
                          }
                        }
                      }
                    } catch(e) {}
                    return "";
                  })()`,
                                    returnByValue: true,
                                });
                            }, 1500);
                        }
                    }
                    // 3. Check poll result
                    const value = msg.result?.result?.value;
                    if (value && typeof value === 'string' && value.length > 10) {
                        stop();
                        resolve(value);
                    }
                }
                catch { /* ignore */ }
            };
            ws.onerror = () => { stop(); reject(new Error('WebSocket 錯誤')); };
            ws.onclose = () => { stop(); reject(new Error('WebSocket 關閉')); };
            setTimeout(() => { stop(); reject(new Error('登入逾時（5 分鐘）')); }, 300000);
        });
        return await tokenPromise;
    }
    finally {
        try {
            chromeProc.kill();
        }
        catch { /* already dead */ }
    }
}
