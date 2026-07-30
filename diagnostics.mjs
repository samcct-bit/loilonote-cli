import { spawn, execSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
import fs from 'node:fs';

const WebSocketConstructor = globalThis.WebSocket;
if (!WebSocketConstructor) {
  console.error('需要 Node.js 22+ 的原生 WebSocket 支援');
  process.exit(1);
}

function findChromePath() {
  if (process.platform === 'win32') {
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    ];
    for (const p of paths) {
      try { execSync(`"${p}" --version`, { stdio: 'ignore' }); return p; } catch { /* continue */ }
    }
  }
  return 'google-chrome';
}

const port = randomInt(9222, 9999);
const chromePath = findChromePath();
const userDataDir = `${process.env.TEMP || '/tmp'}/loilonote-diag-${randomInt(10000, 99999)}`;

console.log('正在啟動 Chrome (探測模式)...');
const chromeProc = spawn(chromePath, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  'https://loilonote.app/login',
], {
  detached: true,
  stdio: 'ignore',
});

async function run() {
  let wsUrl;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (!res.ok) continue;
      const data = await res.json();
      const page = data.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page?.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch { /* retry */ }
  }

  if (!wsUrl) throw new Error('無法連接 CDP');

  const ws = new WebSocketConstructor(wsUrl);
  let msgId = 0;
  const send = (method, params) => ws.send(JSON.stringify({ id: ++msgId, method, params }));

  const dumps = [];
  
  ws.onopen = () => {
    send('Network.enable');
    console.log('\n====================================================');
    console.log('✅ 已成功連線至瀏覽器！');
    console.log('👉 請在彈出的瀏覽器中：');
    console.log('   1. 登入您的帳號');
    console.log('   2. 新增一張「網頁卡片」和一張「圖片卡片」');
    console.log('   3. 將其中一張卡片「繳交」到任何一個測試作業箱');
    console.log('');
    console.log('完成這些動作後，回到這個終端機按 Ctrl+C。');
    console.log('網路紀錄會自動存成 api_dump.json！');
    console.log('====================================================\n');
  };

  const requests = new Map();

  ws.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Network.requestWillBeSent') {
        const req = msg.params.request;
        if (req.method === 'POST' || req.method === 'PUT') {
           const url = req.url;
           if (url.includes('/api/') || url.includes('s3') || url.includes('upload')) {
               const id = msg.params.requestId;
               let postDataPreview = req.postData;
               if (postDataPreview && postDataPreview.length > 2000) {
                   postDataPreview = postDataPreview.substring(0, 2000) + '...[truncated]';
               }
               requests.set(id, { 
                 url, 
                 method: req.method, 
                 headers: req.headers, 
                 postData: postDataPreview 
               });
           }
        }
      }
      
      if (msg.method === 'Network.responseReceived') {
          const id = msg.params.requestId;
          if (requests.has(id)) {
             const req = requests.get(id);
             req.responseStatus = msg.params.response.status;
          }
      }
      
      if (msg.method === 'Network.loadingFinished') {
          const id = msg.params.requestId;
          if (requests.has(id)) {
             const req = requests.get(id);
             dumps.push(req);
             console.log(`[攔截成功] ${req.method} ${req.url.substring(0, 100)}...`);
             requests.delete(id);
          }
      }
    } catch(e) {}
  };
  
  process.on('SIGINT', () => {
     fs.writeFileSync('api_dump.json', JSON.stringify(dumps, null, 2));
     console.log('\n✅ 感謝！已將攔截到的封包存檔至 api_dump.json');
     console.log('請告訴 AI 檔案已經產生好了！');
     try { chromeProc.kill(); } catch {}
     process.exit(0);
  });
}

run().catch(console.error);
