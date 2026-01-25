# Agent Skills

A collection of [Agent Skills](https://agentskills.io) for extending AI agent capabilities.

## Skills

| Skill | Version | Description |
|-------|---------|-------------|
| [bhvr-cloudflare](skills/bhvr-cloudflare) | 1.0.0 | Build full-stack apps on Cloudflare Workers with single-origin architecture |
| [intro-email-generator](skills/intro-email-generator) | 1.2.1 | Craft compelling, forwardable introduction emails for job referrals |
| [network-jobs](skills/network-jobs) | 2.0.4 | Search job openings at companies where you have connections |

## Usage

Skills follow the [Agent Skills specification](https://agentskills.io/specification). Each skill contains a `SKILL.md` file with metadata and instructions.

### Installing a Skill

Download the skill package and extract it to your agent's skills directory:

```bash
# Example for Claude Code
curl -L https://github.com/hirefrank/skills/raw/main/dist/skills/bhvr-cloudflare-1.0.0.zip -o skill.zip
unzip skill.zip -d ~/.claude/skills/
```

## Development

### Prerequisites

- [Bun](https://bun.sh) runtime
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI (for R2 deployment)

### Commands

```bash
# Install dependencies
bun install

# List available skills
bun run skills:list

# Build all skills
bun run skills:build

# Build and deploy to R2
bun run skills:deploy
```

### Creating a New Skill

1. Create a new directory under `skills/`
2. Add a `SKILL.md` file with required frontmatter:

```yaml
---
name: my-skill
description: What the skill does and when to use it.
metadata:
  version: "1.0.0"
---
```

3. Add instructions in the markdown body
4. Optionally add `references/`, `scripts/`, or `assets/` directories

See the [Agent Skills specification](https://agentskills.io/specification) for details.

## License

MIT
