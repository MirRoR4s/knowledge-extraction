---
title: 氛围编程最佳实践：如何获得一致结果
category: vibe-coding
tags: [Vibe Coding, 最佳实践, 上下文管理, 安全]
date: 2026-07-01
---

# [氛围编程最佳实践：如何获得一致结果](https://roadmap.sh/vibe-coding/best-practices)

## TL;DR 速查表

| # | 最佳实践 | 行动指南 |
|---|---------|---------|
| 1 | 保持上下文配置文件精简且内容最新 | 从 `CLAUDE.md`、`GEMINI.md`、`.cursorrules` 等文件中移除过时内容 |
| 2 | 功能之间重置上下文 | 一个功能一个会话，使用工具的上下文重置命令 |
| 3 | 每个新功能启动前先做规划 | 在生成任何代码前要求 AI 先产出计划 |
| 4 | 编写限定范围与约束的提示词 | 明确目标、列出约束条件、指定不可触碰的文件 |
| 5 | 给 AI 一个参考示例文件 | 提供代码示例而非抽象描述 |
| 6 | 每次接受修改前审查 diff | 检查文件删除、API 变更、新依赖、禁区文件 |
| 7 | 每次接受变更后运行测试 | 每次执行 typecheck + test + lint |
| 8 | 声明禁区 | 在配置文件和相关提示词中标明敏感数据所在位置 |
| 9 | 每次 Schema 变更前要求迁移计划 | 生成代码前先审查 schema 变更摘要和回滚方案 |
| 10 | 为重复性任务构建 Skills | 保存最佳提示词模式，复用并消除输出差异 |

## 核心论点

1. **氛围编程失败的根本原因不是工具而是使用方式。** 常见场景：写出提示词 → 一路点接受 → 回头审查时发现代码难以审查、存在安全漏洞、风格不一致。问题不在于 AI 编程工具本身，而在于缺乏清晰的指令和可复用的工作模型。否则你会发现自己花费更多时间修复代码、消耗大量 token，甚至在会话中途达到用量上限。

2. **从陈旧上下文到错误代码的链式失效。** 如果 AI 以过期的上下文开始会话 → 计划建立在错误的假设上 → 产出错位的代码 → 未经仔细审查的代码引入 bug 和安全漏洞 → 没有可复用流程导致跨会话输出不一致。阻断这条链的每一步，才能获得可靠结果。

3. **氛围编程中你的角色是监督者（Supervisor），不是代码写手。** 你负责给出清晰指令、建立工作机制，AI 负责生成代码。核心工作流是：管理上下文 → 规划提示词 → 审查输出 → 保护关键代码 → 标准化可复用流程。

## 关键概念与定义

| 概念 | 定义 |
|------|------|
| **氛围编程（Vibe Coding）** | 使用自然语言描述期望功能，AI 生成代码、管理文件、运行测试、修复 bug、重构，同时允许迭代精炼的开发方式 |
| **上下文泄漏（Context Bleed）** | 在单个长会话中处理多个功能时，AI 将早期对话中的上下文带到后续对话中，导致输出包含错误假设 |
| **Plan Mode（计划模式）** | AI 编码工具中让 AI 先读取代码库、概述意图、列出将创建/修改的文件和函数签名，供用户审查批准后再生成代码的模式 |
| **Skills（技能）** | 保存为 Markdown 文件的可复用提示词模式，确保重复性任务输出一致。源自 Claude Code，已成为各平台通用的开放式标准 |
| **上下文配置文件** | AI 编程工具在每次会话启动时读取的项目级配置（CLAUDE.md、GEMINI.md、.cursorrules 等），相当于给新配对的程序员的"技术简报" |

氛围编程相比传统软件开发的差异：AI 编写代码，你确保输出与架构方向一致。

## 方法论与最佳实践

### 第一阶段：管理上下文

#### 实践 1：保持上下文配置文件精简且内容最新

大多数 AI 代码生成失败源于上下文过时或负载过重。上下文窗口很快就会被填满——随着会话增长，输出质量会逐降。

**各工具的配置文件名：**

| 工具 | 配置文件 |
|------|----------|
| Claude Code | `CLAUDE.md` |
| Gemini CLI | `GEMINI.md` |
| Cursor | `.cursor/rules/`（放置 `.mdc` 规则文件） |
| Windsurf | `.windsurfrules` |
| OpenAI Codex | `AGENTS.md` |

**常见错误**：把配置文件当作文档来写，包含所有可能的决策说明。只需包含与该会话相关的指令。

| 保留 | 移除 |
|------|------|
| 构建和运行命令 | 上周会话的 bug 上下文 |
| 目录结构概览 | 临时 deadline 或 sprint 笔记 |
| 命名和风格约定 | 即将移除的实验代码 |
| 禁区的文件与文件夹 | 已被推翻的决策 |
| 测试框架和运行方式 | 决策背后的长篇解释 |

配置文件应控制在 50 行以内——作者见过某些 `CLAUDE.md` 膨胀到 200 多行，当 Claude 读完所有这些内容后，已无法区分哪些指令才是重点。以下是精简有效的 `CLAUDE.md` 示例：

```
# my-app

## Stack
- Node 20 + TypeScript (strict mode)
- pnpm, Vite, Vitest
- PostgreSQL via Prisma

## Run commands
- pnpm dev        # start local server
- pnpm test       # run all tests
- pnpm lint       # ESLint + Prettier
- pnpm typecheck  # tsc --noEmit

## Conventions
- Prefer small, pure functions over classes
- No clever abstractions — clarity over brevity
- All new features need a Vitest test file

## Off-limits (never touch without explicit instruction)
- /src/auth/** (authentication flows)
- /src/payments/** (payment processing)
- Any schema migration — propose a plan first

## If unsure
- Propose 2 options and ask me to choose
- Never rename public APIs without asking
```

不遵守这些规则，AI 一启动会话就会带着过期或矛盾的上下文，最终产生错误的实现。

#### 实践 2：重置与精炼上下文

上下文泄漏是 AI 编码工作流中最常见的隐蔽 bug 来源。当你在单个长会话中处理多个功能时，AI 会延续之前的模式并引用之前处理过的文件。

**Claude Code 中的三个上下文管理命令：**

1. **`/clear`**：重置上下文窗口。每个独立任务后都应执行。执行后不会保留前一会话的记忆，需重新提供目标、文件状态和约束条件。示例：

```
> Goal: Add email notifications when a task is marked complete.
  Constraints: Follow CLAUDE.md. Touch only the notification
  module and the task completion handler. No schema changes.
  Start by proposing a plan. Do not write code yet.
```

2. **`/compact`**：压缩对话历史，保留重要代码和决策，释放空间。上下文接近满时使用。执行后应快速浏览摘要，检查遗漏和错误。

3. **`/rewind`**：回退到之前的检查点。会打开回退列表，可选择恢复代码和对话、仅恢复对话、仅恢复代码、摘要或直接返回。注意：`/rewind` 不是 `/clear` 的替代品——前者撤销操作，后者重置上下文。也可以通过双击 Esc 来回退。

在 Gemini CLI 中，`/clear` 和 `/rewind` 类似，使用 `/compress` 压缩上下文。Cursor 和 Windsurf 建议每个新功能开启新聊天。

---

### 第二阶段：规划提示词

#### 实践 3：每个新功能使用 Plan Mode

不要让 AI 在没有任何计划审核的情况下生成代码——这是作者最推崇的一条习惯，节省的时间超过清单上其余任何实践，作者从未跳过这一步。在 Claude Code 中，按 `Shift + Tab` 两次或使用 `/plan` 进入 Plan Mode。

**理想工作流：**

1. 进入 Plan Mode，描述功能并让 AI 概述：将创建/编辑的文件、将引入的函数签名、边界情况和错误处理：

```
> I want to add email/password authentication.
  Propose: the files you'll create or modify, the session
  strategy you'll use, how you'll store credentials, and
  how you'll handle password resets. List any assumptions.
```

2. 审查计划并提问。如果计划涉及你意料之外的文件，先问为什么。

3. 满意后退出 Plan Mode，让 AI 实现：

```
> Implement the OAuth flow from your plan. Write tests for
  critical components, run the test suite, and fix any failures.
```

4. 实现后让 AI 提交并创建 PR：

```
> commit with a descriptive message and open a PR
```

> 务必在计划提示词中加上 **"List any assumptions"**。Claude 的假设是导致输出与预期偏离的常见原因，在它动手写代码前就识破这些假设至关重要。

#### 实践 4：编写有范围和约束的提示词

每条提示词应包含：目标、约束列表、验证是否成功的指令。避免开放式提示词如 "Add error handling to my app"，这会导致 AI 到处添加错误处理。

**好的提示词示例：**

```
> Goal: Add input validation to POST /api/tasks.

Constraints:
- Follow CLAUDE.md conventions
- Only modify src/routes/tasks.ts and src/validators/
- No changes to code test unless currently failing
- Do not touch: ./env/

Process:
1. Propose your approach and list the files you'll edit
2. Wait for my approval
3. Implement
4. Run: npm run dev
5. Summarize: what changed, any risks, how to revert
```

#### 实践 5：给 AI 一个示例文件作为参照

一个好示例文件胜过一百字的风格描述——它精确展示了期望功能在实际上下文中的样子。

```
> Before writing any code, read src/routes/users.ts.
  That file shows the pattern I use for all routes:
  error handling, validation, response format.
  Match that pattern exactly when building the tasks route.
```

这在 UI 框架（如 Tailwind CSS）中尤其有效，因为一致的类使用和组件结构至关重要。

---

### 第三阶段：审查输出

#### 实践 6：接受前始终审查 diff

把每次代码生成当作对初级开发者的 PR 来审查：读、测试、理解修改内容和原因后再合并。

AI 编码工具往往默认变更是安全的，会大范围套用修改——如果它认为某个文件冗余就可能删除它，如果它认为 API 端点签名需要改变就会到处修改。作者多次发现 Claude 在审查之外静默重命名了公开 API 端点，如果没检查 diff，那些变更就会破坏所有客户端。未经审查就接受 AI 的输出，意味着你在依赖 AI 的判断而非自己的判断——这非常冒险。

**diff 审查中始终关注的关键类别：**

- **文件删除**：检查被删除的文件是否在其他地方被引用，或包含有意保留的文档和模式。
- **公共 API 变更**：交叉检查重命名的函数、变更的签名、新增的导入。对 Web 应用尤其关键。
- **禁区文件**：如果 AI 触碰了配置中声明的禁区文件，拒绝变更后调查原因。
- **新依赖和 API 密钥**：检查 `package.json` 中的新增项，以及源代码中是否有硬编码的 API 密钥或凭据。
- **Schema 变更**：仔细审查迁移文件、ORM 模型或数据库 schema 的每次修改。

此外，还需留意新增的数据源、模型行为变更或被静默重写的业务逻辑。这些在快速扫描中很容易被忽略，却会对应用产生重大影响。

审查前让 AI 自述风险：

```
> Before I accept this:
  summarize the changes you made, list any files you deleted,
  note any new dependencies you added,
  and flag anything that could break existing functionality
  I haven't tested yet.
```

这样做有助于捕捉 diff 快速扫描可能遗漏的问题。

#### 实践 7：每次接受变更后运行测试和类型检查

接受输出后立即运行测试套件和类型检查。AI 可能生成看起来正确、运行时却失败的代码。接受的变更与测试之间的间隔越长，越难追溯故障来源。

```
pnpm typecheck   # run TypeScript type checks
pnpm test        # run the full test suite
pnpm lint        # catch style and rule violations
```

如果任何一项失败，不要继续——使用 `/rewind` 或解决问题后再进行下一个提示词。

---

### 第四阶段：保护代码库

氛围编程工具可能在用户认证、输入验证和访问控制检查中引入安全漏洞。AI 模型基于大量公开代码训练，其中包含不安全的代码模式。云安全联盟（Cloud Security Alliance）和顶尖安全专家一致强调：AI 生成代码至少需要与人类编写代码同等严格的安全审查，有时甚至需要更严格的审查。以下实践教你如何构建约束，保护高风险代码免遭非预期修改。

#### 实践 8：在配置文件中声明禁区

敏感代码区域必须在 `CLAUDE.md` 中显式声明为 off-limits，并在相关提示词中重复强调。

```
## Off-limits
- /src/auth/**
- /src/payments/**
- /src/middleware/rbac.ts
- Any file ending in .migration.ts
- .env and any file that handles environment variables

## For off-limits areas, always:
- Propose a plan and get explicit approval before touching
- Include a rollback strategy in the plan
- Require test coverage for any change
```

仅在配置中声明还不够，必须在提示词中重申：

```
> Add a 'last seen' timestamp to the user profile.
  Constraints: Modify only src/models/user.ts and the profile
  update handler. Do NOT touch src/auth/ — user authentication
  logic is off-limits.
```

> 特别关注处理用户输入、限流和 API 密钥管理的 AI 生成代码，这些区域容易出现注入攻击和敏感数据暴露。

#### 实践 9：Schema 变更前要求迁移计划

不要让 AI 直接写 schema 迁移，必须先产出书面计划，包含：前向变更 SQL、回滚 SQL、验证测试。

```
> I need to add a 'priority' column to the tasks table.
  Enter Plan Mode. Before writing anything, produce:
  1. The migration SQL (up and down)
  2. The Prisma schema change
  3. Any application code that needs updating
  4. The rollback steps if this migration fails in production
  Wait for my approval before writing any code.
```

> 提前要求提供 up 和 down 迁移，能确保回滚方案真实存在，且在接触数据前就已经过审查。

---

### 第五阶段：可复用工作流

#### 实践 10：为重复性高风险任务构建 Skills

Skills 是保存为 Markdown 文件的可复用提示词模式，确保重复性任务的输出一致。源于 Claude Code，已被 Gemini CLI、Codex CLI 等原生支持。对 Cursor 和 Windsurf，等效概念在配置文件中。

在 Claude Code 中，在 `.claude/skills/` 目录下创建 `SKILL.md`：

```
# .claude/skills/write-tests/SKILL.md
---
name: write-tests
description: Writes tests for a module following project Vitest
  conventions. Use when asked to write unit tests.
---

When asked to write tests for a module:
1. Read the module and identify all exported functions
2. For each function, write tests that cover:
   - Happy path with valid input
   - Edge cases (empty input, null values, boundaries)
   - Error cases (invalid input, missing dependencies)
3. Use Vitest. Follow the pattern in tests/example.test.ts
4. Run pnpm test when done and report results
5. Do not modify the module under test
```

技能也可定义工作流，如修复 GitHub issue 或代码审查：

```
# .claude/skills/review-code/SKILL.md
---
name: review-code
description: Review code for quality and issues
disable-model-invocation: true
---

When asked to review code:
1. Read and understand the code
2. Check for bugs or logical errors
3. Identify performance issues
4. Suggest improvements for readability
5. Check for security concerns
6. Ensure coding standards are followed
7. Summarize findings clearly
```

通过 `/skill-name`（如 `/write-tests`、`/review-code`）在 Claude Code 中直接运行。当对话上下文触及相关 Skill 的适用场景时，它也会被自动加载。

**推荐在项目中构建的四类核心 Skill：**

1. **生成单元测试**：遵循项目框架和约定，覆盖边界和错误情况。每个 PR 前使用。
2. **安全审查**：检查暴露的敏感数据、未验证的用户输入、缺失的访问控制、注入攻击、API 密钥与环境变量相关的不安全代码模式。在合并 API、认证或用户输入相关代码前使用。
3. **安全重构**：保持公共 API 不变，更新全代码库调用方，添加 changelog 条目，运行测试。重组现有代码时使用。
4. **安全迁移生成**：要求 up SQL、down SQL、schema 变更、应用代码更新和回滚计划。每次 schema 变更前使用。

**Skills 使用要点**：
- 同一提示词模式使用三到四次、摸清了最佳输出应长什么样后，再封装为 Skill
- 将 Skills 目录提交到版本控制（如 GitHub），让团队和子智能体均可使用

## 结语

你的 AI 编码工具只是软件开发工作流的一部分，而非你判断力和专业知识的替代品。无论使用哪种工具，你始终是架构师、审查者和决策者。AI 扮演一位高效能干的协作者，放大你的工作成果。从中获取最佳效果需要清晰的简报、严格的范围和诚实的反馈。

持续遵循这些最佳实践，你将看到：更短的会话、更小的 diff、更快的调试速度和更一致的输出。

## 一句话总结

> 氛围编程的成功取决于你作为监督者的纪律——精简上下文、限定范围、逐 diff 审查、声明禁区、封装可复用工作流，而非工具本身。

**对你有何价值**：适合所有使用 Claude Code、Cursor、Windsurf 等 AI 编码工具且希望从"碰运气式生成"转向"可复现高质量输出"的开发者，提供了从会话启动到代码合入的完整实操检查清单。
