---
title: Vibe Coding 实战教程：用 Claude Code 构建你的第一个应用
category: vibe-coding
tags: [Claude Code, 教程, CLI, Node.js]
date: 2026-07-01
---

# Vibe Coding 实战教程：用 Claude Code 构建你的第一个应用

> 原文：<https://roadmap.sh/vibe-coding/tutorial> — 预计跟随操作耗时 30-45 分钟。

## 核心论点

1. **从"AI 当副手"到"AI 做主程"的工作范式变革。** 在 AI 编程工具面前，传统的逐行手写代码逐步被自然语言描述需求的"氛围编程（Vibe Coding）"取代。本文通过一个真实 CLI 任务管理器的完整构建过程，展示如何用 Claude Code 实现"描述即交付"的工作流。

2. **好 Prompt + 好上下文 = 持续稳定的 AI 输出。** 决定 Claude Code 产出质量的核心因素并非单次提示词技巧，而是两件事：用 `CLAUDE.md` 为每个会话注入持久的项目上下文，以及在编码前强制使用 Plan Mode（计划模式）让 AI 先理清思路。

3. **恢复与纠错能力是 Vibe Coding 生产级实践的关键。** `/rewind`、`/clear`、`/compact` 与 Esc 打断等命令构成了与 AI 协作时的"安全网"，其重要性不亚于编写 Prompt 本身。

## 前置知识背景

- **Claude Code**：Anthropic 推出的终端内 AI 编程助手，直接运行在项目目录中，可读写文件、执行命令、基于 Git 状态获取项目上下文。
- **Claude 订阅要求**：免费版不包含 Claude Code，需 Pro、Max、Team 或 Enterprise 订阅。
- **运行环境**：Node.js v18+、npm/npx、Git。Windows 用户建议通过 WSL2 使用。

## 关键概念与定义

| 概念 | 定义 |
|------|------|
| **Vibe Coding（氛围编程）** | 用自然语言 Prompt 描述需求来驱动 AI 生成代码，而非手动编写每行代码。面向非程序员、初学者以及希望提升速度的资深开发者。 |
| **CLAUDE.md** | 项目根目录下的 Markdown 文件，Claude Code 在每个会话启动时自动读取。包含项目描述、技术栈、运行命令、编码规范与约束——相当于给 AI 的"新成员入职文档"。 |
| **Plan Mode（计划模式）** | Claude Code 中一种先分析再实现的模式。进入后 AI 会审查项目结构、阅读相关文件、提出实现方案，经用户确认后再动手编码。按 `Shift+Tab` 两次或执行 `/plan` 命令进入。 |
| **/rewind** | 回退到对话的早期节点，恢复到对话较早状态以便换另一种思路。 |
| **/compact** | 将长对话压缩为摘要，保留关键决策与上下文，释放上下文窗口。 |
| **/clear** | 彻底清空对话上下文，适合完成一个功能后切换到下一个新任务。 |

## 方法论与最佳实践

### 整体工作流（八步法）

1. **安装 Claude Code**：`npm install -g @anthropic-ai/claude-code`，然后运行 `claude` 完成认证。
2. **创建项目目录并初始化 Git**：`mkdir task-manager && cd task-manager && git init`。Git 历史本身就是 Claude Code 的上下文信号之一。
3. **生成并定制 CLAUDE.md**：在项目内启动 `claude` 会话，执行 `/init` 自动扫描目录生成模板，再手动补充项目描述、技术栈、运行命令和编码规范。
4. **每项功能都先进入 Plan Mode**：用 `/plan` 或 `Shift+Tab` 进入，或直接以 "Create a plan for..." 开头 Prompt。
5. **逐步构建核心功能**：一个 Prompt 一个功能，层层叠加，每一步验证后再推进下一步。
6. **处理异常与纠错**：掌握 Esc 打断、`/rewind`、精准纠正性 Prompt、`/clear` 和 `/compact` 五种手段。
7. **手动冒烟测试 + 可选单元测试**：逐条验证 add / list / complete / delete，也可让 Claude Code 生成基于 Node 内置 test runner 的测试。
8. **可选部署**：通过 Railway CLI 一键部署。

### 目标应用结构

```
task-manager/
├── index.ts          # 入口，解析 process.argv 路由到各命令
├── tasks.ts          # 任务 CRUD 逻辑 + readTasks/writeTasks 工具函数
├── tasks.json        # 持久化存储（自动创建）
├── package.json
└── tsconfig.json     # strict: true
```

支持命令：`add`、`list`、`complete`、`delete`。

### 五步构建 Prompt（关键实操）

**Prompt 1 — 脚手架**

```
Scaffold a Node.js/TypeScript CLI task manager.
Create package.json, tsconfig.json, and index.ts.
index.ts should parse process.argv and route to
command handlers: add, list, complete, and delete.
Use a local tasks.json file for storage.
Don't implement the command handlers yet — just the routing.
```

> 预期结果：生成 `package.json`（含 ts-node、typescript 依赖）、`tsconfig.json`（strict mode）、含 `switch` 路由骨架的 `index.ts`。

**Prompt 2 — 实现 add 命令**

```
Implement the add command handler in a task.ts.
It should accept a task title as a string argument.
Append a new task to tasks.json with these fields:
id (auto-incremented), title, done: false, createdAt (ISO timestamp).
If tasks.json doesn't exist, create it with an empty array first.
```

**Prompt 3 — 实现 list 命令**

```
Implement the list command.
Read tasks from tasks.json and display them in a clean table.
Columns: ID, Title, Status (show 'done' or 'pending').
If there are no tasks, print: 'No tasks yet. Use add to create one.'
```

**Prompt 4 — 实现 complete 和 delete 命令**

```
Implement the complete and delete commands.
Both accept a task ID as an argument.
complete: sets done to true for the matching task.
delete: removes the task from the array entirely.
If the ID doesn't exist, print a helpful error and exit.
```

**Prompt 5 — 输入校验与帮助信息**

```
Add input validation across all four commands.
If add is called without a title, print: 'Usage: add <title>'
If complete or delete are called without an ID, print the correct usage.
If an unknown command is run, print a help message listing all commands.
```

### 好的 CLAUDE.md 的结构模板

```markdown
# project-name

## What this project does
简短说明应用用途、主要功能和要解决的问题。

## Tech stack
- Runtime: ...
- Language: ...
- Storage: ...

## Run commands
- Install: npm install
- Run: npx ts-node index.ts
- Build: npx tsc

## Conventions
- 编码风格、目录结构、命名规范
- 测试要求、架构模式
- 约束规则：哪些文件不可删除、添加依赖的规则、输入验证要求等
```

### Prompt 编写原则

- **越具体，越少返工**：定义预期行为、涉及的文件、输入输出约束。
- **分层推进**：先搭骨架，再填功能，每步验证。
- **约束声明**：明确"不要做什么"（如 "Don't implement the command handlers yet"）。

## 技术细节与陷阱

### 错误恢复五法

| 手段 | 使用场景 | 操作方式 |
|------|----------|----------|
| **Esc 打断** | AI 正在生成错误方向或多余文件 | 按 `Esc` 立即中止，查看当前进度 |
| **/rewind** | 多处文件被错误修改，简单纠正不够 | 执行 `/rewind` 回退到对话早期节点 |
| **纠正性 Prompt** | 输出有小偏差但未严重破坏 | 明确指出哪个函数需要改、哪些部分不要动 |
| **/clear** | 一个功能完成，切换上下文 | 彻底清空对话，新任务不受旧上下文干扰 |
| **/compact** | 上下文窗口变长，响应开始漂移 | 压缩对话为摘要，保留关键决策 |

### 验证命令

```bash
npx ts-node index.ts add "Buy groceries"    # 添加任务
npx ts-node index.ts list                   # 列出任务
npx ts-node index.ts complete 1             # 标记完成
npx ts-node index.ts delete 1               # 删除任务
```

### Railway 部署（可选）

```bash
npm install -g @railway/cli
railway login
railway up
railway open
```

### 陷阱

- **不做 Plan Mode 直接写代码**：看似省时间，实则返工率显著上升。Plan Mode 是先"想"再"做"，减少误实现。
- **跳过 CLAUDE.md**：每次会话 Claude 都从零开始，无法感知项目约定和历史决策，输出一致性极差。
- **忘记初始化 Git**：Claude Code 的上下文推断依赖 Git 状态和 `.gitignore`，缺失会降低其理解准确度。
- **任务 ID 不存在时不报错**：`complete` 和 `delete` 必须对无效 ID 友好报错，否则静默失败极难排查。

## 一句话总结

用 CLAUDE.md 定义上下文、Plan Mode 先想后做、分层 Prompt 逐步构建，是 Vibe Coding 可复用的核心工作模式。

## 对你有何价值

适合**首次接触 Claude Code / Vibe Coding 的开发者**：本文提供了一个零依赖、30 分钟可跑通的完整实操案例，以及一套可直接套用到其他项目的工作流模板。
