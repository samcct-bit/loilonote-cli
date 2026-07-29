#!/usr/bin/env node
import { Command } from 'commander';
import { LoilonoteClient, AuthManager, loadConfig } from '@loilonote/core';

const program = new Command();

program
  .name('loilonote')
  .description('Loilonote School CLI')
  .version('0.1.0');

// --- Auth ---
program
  .command('login')
  .description('登入 Loilonote（互動式）')
  .option('--token <token>', '直接指定 auth_token（跳過互動式流程）')
  .action(async (opts: { token?: string }) => {
    if (opts.token) {
      const auth = new AuthManager();
      auth.setToken(opts.token);
      const valid = await auth.validate();
      if (valid) {
        console.log('登入成功（token 有效）');
      } else {
        console.error('Token 無效，請重新取得');
        process.exit(1);
      }
      return;
    }

    console.log('正在打開瀏覽器...');
    const { exec } = await import('node:child_process');
    const openCmd = process.platform === 'win32'
      ? 'start "" "https://loilonote.app/login"'
      : process.platform === 'darwin'
        ? 'open "https://loilonote.app/login"'
        : 'xdg-open "https://loilonote.app/login"';
    exec(openCmd);

    console.log('');
    console.log('═══ 登入 Loilonote ═══');
    console.log('');
    console.log('1. 在瀏覽器中完成登入（Google / Microsoft）');
    console.log('2. 登入後，按 F12 打開 DevTools');
    console.log('3. 切換到 Console 分頁');
    console.log('4. 貼上以下程式碼並按 Enter：');
    console.log('');
    console.log('  ┌─────────────────────────────────────┐');
    console.log('  │ const f=window.fetch;window.fetch=   │');
    console.log('  │ function(u,...a){const m=(""+u)      │');
    console.log('  │ .match(/auth_token=([A-Za-z0-9_-]    │');
    console.log('  │ {10,})/);if(m){copy(m[1]);alert     │');
    console.log('  │ ("已複製！貼回終端機")};return       │');
    console.log('  │ f.apply(this,[u,...a])};             │');
    console.log('  │ console.log("現在點任何頁面，token   │');
    console.log('  │ 自動複製到剪貼簿")                   │');
    console.log('  └─────────────────────────────────────┘');
    console.log('');
    console.log('5. 回到 Loilonote 頁面，隨便點一個筆記或課程');
    console.log('6. 看到「已複製」提示後，回到這裡貼上：');

    const readline = (await import('node:readline')).createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const token = await new Promise<string>((resolve) => {
      readline.question('auth_token: ', (answer: string) => {
        readline.close();
        resolve(answer.trim());
      });
    });

    if (!token) {
      console.error('未輸入 token');
      process.exit(1);
    }

    const auth = new AuthManager();
    auth.setToken(token);
    const valid = await auth.validate();
    if (valid) {
      console.log('登入成功！Token 已儲存至 ~/.loilonote/config.json');
    } else {
      console.error('Token 無效，請確認後重試');
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('清除登入狀態')
  .action(() => {
    const auth = new AuthManager();
    auth.logout();
    console.log('已登出');
  });

program
  .command('whoami')
  .description('顯示目前登入身份')
  .action(() => {
    const auth = new AuthManager();
    const session = auth.getSession();
    if (session) {
      console.log(`${session.display_name}（${session.school_name}）`);
      console.log(`教師: ${session.is_teacher ? '是' : '否'}`);
      console.log(`Token 有效至: ${session.expired_at}`);
    } else if (auth.isAuthenticated()) {
      console.log('已設定 token（無 session 資訊，執行 loilonote course list 測試連線）');
    } else {
      console.log('未登入。執行 loilonote login --token <token>');
    }
  });

// --- Courses ---
const course = program.command('course');

course
  .command('list')
  .description('列出所有課程')
  .action(async () => {
    const client = new LoilonoteClient();
    try {
      const result = await client.listCourses();
      const groups = Array.isArray(result) ? result : [result];
      for (const group of groups) {
        console.log(`\n📂 ${group.user_group_name}`);
        for (const c of group.courses) {
          console.log(`  [${c.course_id}] ${c.name}  ${c.in_charge ? '(教師)' : ''}`);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

course
  .command('get <id>')
  .description('取得課程詳細內容')
  .action(async (id: string) => {
    const client = new LoilonoteClient();
    try {
      const c = await client.getCourse(Number(id));
      console.log(`課程: ${c.name}`);
      console.log(`班級: ${c.user_group_name} (${c.user_group_code})`);
      console.log(`學年: ${c.academic_year}`);
      console.log(`期間: ${c.course_start_at} ~ ${c.course_finish_at}`);
      console.log(`教師: ${c.teachers.map(t => t.display_name).join(', ')}`);
      console.log(`學生: ${c.students.length} 人`);
      console.log(`當前作業: #${c.current_submission_number}「${c.submission_message}」`);
      console.log(`畫面鎖定: ${c.is_screen_locked ? '是' : '否'}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

course
  .command('students <id>')
  .description('列出課程學生名單')
  .action(async (id: string) => {
    const client = new LoilonoteClient();
    try {
      const c = await client.getCourse(Number(id));
      for (const s of c.students) {
        console.log(`  ${s.sort_key?.padEnd(4) ?? '    '} ${s.display_name.padEnd(16)} ${s.username.split('@')[0]}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

// --- Notes ---
const note = program.command('note');

note
  .command('list <courseId>')
  .description('列出課程中的筆記')
  .action(async (courseId: string) => {
    const client = new LoilonoteClient();
    try {
      const result = await client.listNotes(Number(courseId));
      for (const n of result.notes) {
        console.log(`[${n.id}] ${n.name}  v${n.version}  ${n.updated_at}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

note
  .command('get <id>')
  .description('下載筆記（ZIP）')
  .option('-o, --output <path>', '輸出路徑')
  .action(async (id: string, opts: { output?: string }) => {
    const client = new LoilonoteClient();
    try {
      const data = await client.getNote(Number(id));
      const path = opts.output || `note-${id}.zip`;
      const fs = await import('node:fs');
      fs.writeFileSync(path, Buffer.from(data));
      console.log(`已儲存 ${path}（${(data.byteLength / 1024).toFixed(1)} KB）`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

note
  .command('inspect <id>')
  .description('解析筆記結構（版本、卡片類型、頁數）')
  .action(async (id: string) => {
    const client = new LoilonoteClient();
    try {
      const parsed = await client.getParsedNote(Number(id));
      console.log(`版本: ${parsed.version}`);
      console.log(`格式: ${parsed.body.format} (v${parsed.body.version})`);
      console.log(`最後編輯: ${parsed.header.updater.id} (device: ${parsed.header.updater.device_id})`);
      console.log(`卡片數: ${parsed.frameCount}`);
      console.log(`卡片類型: ${parsed.frameTypes.join(', ')}`);
      console.log(`\n各卡片概覽:`);
      for (const f of parsed.body.data.frames) {
        const gadgets = Object.keys(f.gadgets).join(', ');
        console.log(`  [${f.type}] ${f.id.slice(0,8)}...  position:(${f.metadata.position.left.toFixed(0)},${f.metadata.position.top.toFixed(0)})  gadgets: ${gadgets || '(無)'}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

note
  .command('text <id>')
  .description('從筆記中提取純文字內容')
  .action(async (id: string) => {
    const client = new LoilonoteClient();
    try {
      const parsed = await client.getParsedNote(Number(id));
      const text = client.extractText(parsed);
      console.log(text || '(無文字內容)');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

note
  .command('assets <id>')
  .description('列出筆記中的媒體資源（圖片/PDF）')
  .action(async (id: string) => {
    const client = new LoilonoteClient();
    try {
      const parsed = await client.getParsedNote(Number(id));
      const assets = client.extractAssets(parsed);
      for (const a of assets) {
        console.log(`${a.frameType.padEnd(8)} ${a.remoteId}  (frame: ${a.frameId.slice(0,8)}...)`);
      }
      if (assets.length === 0) console.log('(無媒體資源)');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

// --- Submissions ---
program
  .command('submissions <courseId>')
  .alias('sub')
  .description('列出課程的繳交作業')
  .action(async (courseId: string) => {
    const client = new LoilonoteClient();
    try {
      const result = await client.listSubmissions(Number(courseId));
      for (const s of result.submissions) {
        const status = s.submitted ? '已繳' : `開放至 ${s.expiry}`;
        console.log(`[#${s.submission_number}] ${s.message}  ${status}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

// --- Config ---
program
  .command('config')
  .description('顯示目前設定')
  .action(() => {
    const config = loadConfig();
    const safe = { ...config, auth: { ...config.auth, token: config.auth.token ? '***' + config.auth.token.slice(-4) : null } };
    console.log(JSON.stringify(safe, null, 2));
  });

program.parse();
