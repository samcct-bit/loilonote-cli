# @samcct-bit/loilonote-cli

Loilonote School 命令列工具。支援互動式登入、課程/筆記/繳交作業查詢。

## 安裝

```bash
npm install -g @samcct-bit/loilonote-cli
```

## 命令

```bash
# 登入
loilonote login              # 互動式登入（自動打開 Chrome）
loilonote login --token <t>  # 直接指定 token

# 課程
loilonote course list        # 列出所有課程
loilonote course get <id>    # 課程詳情
loilonote course students <id> # 學生名單

# 筆記
loilonote note list <course> # 列出課程筆記
loilonote note get <id>      # 下載筆記 ZIP
loilonote note inspect <id>  # 解析筆記結構
loilonote note text <id>     # 提取純文字

# 繳交作業
loilonote submissions <id>   # 列出繳交作業
```

## License

MIT
