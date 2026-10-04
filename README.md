# Agent Skills

A collection of [Agent Skills](https://agentskills.io/) for AI coding agents. Skills are packaged instructions and scripts that extend agent capabilities.

## Installation

```bash
npx skills add https://github.com/hirefrank/skills
```

Or copy skill directories manually to the appropriate location for your agent:

| Agent | Skill Directory | Docs |
|-------|-----------------|------|
| Claude Code | `~/.claude/skills/` | [docs](https://docs.anthropic.com/en/docs/claude-code/skills) |
| OpenCode | `~/.config/opencode/skill/` | [docs](https://opencode.ai/docs/skills/) |
| OpenAI Codex | `~/.codex/skills/` | [docs](https://developers.openai.com/codex/skills/) |
| Pi | `~/.pi/agent/skills/` | [docs](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent#skills) |

## Available Skills

### bhvr-cloudflare

Build full-stack apps on Cloudflare Workers with single-origin architecture (Bun, Hono, Vite, React).

**Use when:**
- Setting up a new bhvr project on Cloudflare Workers
- Reviewing code for architecture compliance
- Implementing features with zero CORS patterns
- Troubleshooting D1, R2, or Better-Auth issues
- Working with Cloudflare Workers Assets

**Includes:**
- Project templates (wrangler.toml, package.json, vite.config.ts)
- Hono API starter and Better-Auth client config
- Troubleshooting guide for common issues

### intro-email-generator

Craft compelling, forwardable introduction emails for job referrals.

**Use when:**
- Asking a mutual connection to intro you to someone at a company
- Writing emails that can be forwarded without editing
- Connecting your resume to a specific job opportunity

**Features:**
- Analyzes resume against job requirements
- Generates concise, metric-backed emails
- Addresses the forwarder (not the target contact)

Pairs well with **[Network Jobs](https://hirefrank.com/network-jobs)** (separate install) for finding roles at companies where you have connections, then drafting intros with this skill.

## Network Jobs (separate product)

Job search over your **local** LinkedIn graph and job corpus is not in this repo. Install the [Network Jobs](https://hirefrank.com/network-jobs) suite from [hirefrank/network-jobs](https://github.com/hirefrank/network-jobs):

```bash
npm i -g @hirefrank/network-jobs@latest
network-jobs setup --agent auto
```

Or: `npx skills add hirefrank/network-jobs -g -a cursor` (then run `network-jobs setup` for data and the CLI).

The hosted API at `jobs.hirefrank.com` was retired; use the local-first suite above.

## Skill Structure

Each skill follows the [Agent Skills specification](https://agentskills.io/specification):

```
skill-name/
├── SKILL.md          # Instructions and metadata (required)
├── scripts/          # Helper scripts (optional)
├── references/       # Supporting documentation (optional)
└── assets/           # Templates and resources (optional)
```

## Development

### Prerequisites

- [Bun](https://bun.sh) runtime
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI (for R2 deployment)

### Commands

```bash
bun install              # Install dependencies
bun run skills:list      # List available skills
bun run skills:build     # Build all skills to dist/
bun run skills:deploy    # Build and deploy to R2
```

## Resources

- [Agent Skills Specification](https://agentskills.io/specification)
- [Anthropic Skills Documentation](https://docs.anthropic.com/en/docs/claude-code/skills)
- [Example Skills (Anthropic)](https://github.com/anthropics/skills)
- [Example Skills (Cloudflare)](https://github.com/cloudflare/skills)

## License

MIT
