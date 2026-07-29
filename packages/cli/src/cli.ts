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
  .description('登入 Loilonote')
  .option('--token <token>', 'auth_token（從瀏覽器 DevTools 取得）')
  .action(async (opts: { token?: string }) => {
    if (opts.token) {
      const auth = new AuthManager();
      auth.setToken(opts.token);
      console.log('已設定 token');
      return;
    }
    console.error('請提供 --token <token>');
    console.error('取得方式：登入 loilonote.app → DevTools → Network → 任意 n.loilo.tv/api 請求 → 複製 auth_token 參數');
    process.exit(1);
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
  .description('取得課程內容')
  .action(async (id: string) => {
    const client = new LoilonoteClient();
    try {
      const result = await client.getCourse(Number(id));
      console.log(JSON.stringify(result, null, 2));
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
