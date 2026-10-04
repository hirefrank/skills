#!/usr/bin/env bun
/**
 * Build and deploy Agent Skills to R2
 *
 * Usage:
 *   bun run scripts/build-skills.ts              # Build all skills
 *   bun run scripts/build-skills.ts --deploy     # Build and deploy to R2
 *   bun run scripts/build-skills.ts --list       # List available skills
 *   bun run scripts/build-skills.ts skill-name   # Build specific skill
 */

import { $ } from "bun"
import * as fs from "fs"
import * as path from "path"
import * as yaml from "yaml"

// Configuration
const SKILLS_DIR = "skills"
const DIST_DIR = "dist/skills"
const R2_BUCKET = "agent-skills"
const R2_PREFIX = "d"
const CLOUDFLARE_ACCOUNT_ID = "6034f1c5d23e5503f6573740480cf0d6"

interface SkillMetadata {
  name: string
  description: string
  license?: string
  metadata?: {
    version?: string
    [key: string]: unknown
  }
}

interface BuildResult {
  skill: string
  zipPath: string | null
  deployed: boolean
}

async function parseSkillMetadata(skillPath: string): Promise<SkillMetadata | null> {
  const skillMdPath = path.join(skillPath, "SKILL.md")

  if (!fs.existsSync(skillMdPath)) {
    console.error(`No SKILL.md found in ${skillPath}`)
    return null
  }

  const content = fs.readFileSync(skillMdPath, "utf-8")

  // Extract YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) {
    console.error(`No frontmatter found in ${skillMdPath}`)
    return null
  }

  try {
    const metadata = yaml.parse(frontmatterMatch[1]) as SkillMetadata
    return metadata
  } catch (e) {
    console.error(`Failed to parse frontmatter in ${skillMdPath}:`, e)
    return null
  }
}

async function buildSkill(skillName: string): Promise<string | null> {
  const skillPath = path.join(SKILLS_DIR, skillName)

  if (!fs.existsSync(skillPath)) {
    console.error(`Skill not found: ${skillPath}`)
    return null
  }

  const metadata = await parseSkillMetadata(skillPath)
  if (!metadata) return null

  const version = metadata.metadata?.version || "1.0.0"
  const zipName = `${skillName}-${version}.zip`
  const distPath = path.join(DIST_DIR, zipName)

  fs.mkdirSync(DIST_DIR, { recursive: true })

  if (fs.existsSync(distPath)) {
    fs.unlinkSync(distPath)
  }

  // Create temp directory for zipping
  const tempDir = path.join(DIST_DIR, ".temp")
  const tempSkillDir = path.join(tempDir, skillName)

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true })
  }
  fs.mkdirSync(tempSkillDir, { recursive: true })

  await $`cp -r ${skillPath}/. ${tempSkillDir}/`

  // Create zip
  const cwd = process.cwd()
  process.chdir(tempDir)
  await $`zip -r ${path.join(cwd, distPath)} ${skillName}`
  process.chdir(cwd)

  // Cleanup
  fs.rmSync(tempDir, { recursive: true })

  console.log(`✓ Built ${zipName} (v${version})`)
  return distPath
}

async function deploySkill(zipPath: string): Promise<boolean> {
  const zipName = path.basename(zipPath)
  const r2Key = `${R2_PREFIX}/${zipName}`
  const absoluteZipPath = path.resolve(zipPath)

  try {
    await $`CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID} npx wrangler r2 object put ${R2_BUCKET}/${r2Key} --file=${absoluteZipPath} --remote`

    console.log(`✓ Deployed to https://skills.hirefrank.com/${r2Key}`)
    return true
  } catch (e) {
    console.error(`Failed to deploy ${zipName}:`, e)
    return false
  }
}

async function listSkills(): Promise<string[]> {
  if (!fs.existsSync(SKILLS_DIR)) {
    return []
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory())
    .filter((e) => fs.existsSync(path.join(SKILLS_DIR, e.name, "SKILL.md")))
    .map((e) => e.name)
}

async function showSkillList(): Promise<void> {
  const skills = await listSkills()

  if (skills.length === 0) {
    console.log(`No skills found in ${SKILLS_DIR}/`)
    return
  }

  console.log(`\nAvailable skills in ${SKILLS_DIR}/:\n`)

  for (const skillName of skills) {
    const metadata = await parseSkillMetadata(path.join(SKILLS_DIR, skillName))
    if (metadata) {
      const version = metadata.metadata?.version || "1.0.0"
      console.log(`  ${skillName} (v${version})`)
      console.log(`    ${metadata.description.substring(0, 80)}...`)
      console.log()
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const shouldDeploy = args.includes("--deploy")
  const shouldList = args.includes("--list")
  const specificSkill = args.find((a) => !a.startsWith("--"))

  if (shouldList) {
    await showSkillList()
    return
  }

  const skills = specificSkill ? [specificSkill] : await listSkills()

  if (skills.length === 0) {
    console.log(`No skills found in ${SKILLS_DIR}/`)
    return
  }

  console.log(`\nBuilding ${skills.length} skill(s)...\n`)

  const results: BuildResult[] = []

  for (const skill of skills) {
    const zipPath = await buildSkill(skill)
    let deployed = false

    if (zipPath && shouldDeploy) {
      deployed = await deploySkill(zipPath)
    }

    results.push({ skill, zipPath, deployed })
  }

  // Summary
  console.log("\n" + "=".repeat(50))
  console.log("Summary:")
  console.log("=".repeat(50))

  for (const r of results) {
    if (r.zipPath) {
      const status = shouldDeploy ? (r.deployed ? "✓ deployed" : "✗ deploy failed") : "built"
      console.log(`  ${r.skill}: ${status}`)
    } else {
      console.log(`  ${r.skill}: ✗ build failed`)
    }
  }

  // Show download URLs if deployed
  if (shouldDeploy) {
    const deployedResults = results.filter((r) => r.deployed && r.zipPath)
    if (deployedResults.length > 0) {
      console.log("\nDownload URLs:")
      for (const r of deployedResults) {
        if (r.zipPath) {
          const zipName = path.basename(r.zipPath)
          console.log(`  https://skills.hirefrank.com/${R2_PREFIX}/${zipName}`)
        }
      }
    }
  }
}

main().catch(console.error)
