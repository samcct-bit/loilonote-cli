#!/usr/bin/env node
import { Command } from 'commander';
import { LoilonoteClient, AuthManager, loadConfig } from '@loilonote/core';

const program = new Command();

program
  .name('loilonote')
  .description('Loilonote School CLI')
  .version('0.1.0');

// --- Auth commands ---
program
  .command('login')
  .description('登入 Loilonote')
  .action(async () => {
    const auth = new AuthManager();
    try {
      const session = await auth.login();
      console.log(`登入成功，token 有效至 ${session.expiresAt.toISOString()}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`登入失敗：${message}`);
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('清除登入狀態')
  .action(async () => {
    const auth = new AuthManager();
    await auth.logout();
    console.log('已登出');
  });

program
  .command('whoami')
  .description('顯示目前登入身份')
  .action(() => {
    const auth = new AuthManager();
    if (auth.isAuthenticated()) {
      console.log('已登入（token 存在）');
    } else {
      console.log('未登入。請執行 loilonote login');
    }
  });

// --- Notebook commands ---
const notebook = program.command('notebook').alias('nb');

notebook
  .command('list')
  .description('列出筆記本')
  .action(async () => {
    const client = new LoilonoteClient();
    try {
      const result = await client.listNotebooks();
      console.log(JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

notebook
  .command('get <id>')
  .description('取得筆記本內容')
  .action(async (id: string) => {
    const client = new LoilonoteClient();
    try {
      const result = await client.getNotebook(id);
      console.log(JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

notebook
  .command('create')
  .description('建立筆記本')
  .requiredOption('--title <title>', '筆記本標題')
  .action(async (opts: { title: string }) => {
    const client = new LoilonoteClient();
    try {
      const result = await client.createNotebook(opts.title);
      console.log(JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

// --- Card commands ---
const card = program.command('card');

card
  .command('list <notebookId>')
  .description('列出筆記本內的卡片')
  .action(async (notebookId: string) => {
    const client = new LoilonoteClient();
    try {
      const result = await client.listCards(notebookId);
      console.log(JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

card
  .command('get <cardId>')
  .description('取得卡片內容')
  .action(async (cardId: string) => {
    const client = new LoilonoteClient();
    try {
      const result = await client.getCard(cardId);
      console.log(JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`錯誤：${message}`);
      process.exit(1);
    }
  });

// --- Config command ---
program
  .command('config')
  .description('顯示目前設定')
  .action(() => {
    const config = loadConfig();
    // 遮蔽 token
    const safe = { ...config, auth: { ...config.auth, token: config.auth.token ? '***' : null } };
    console.log(JSON.stringify(safe, null, 2));
  });

program.parse();
