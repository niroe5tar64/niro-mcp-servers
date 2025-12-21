#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { basename } from "node:path";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const skillDir = process.argv[2];
if (!skillDir) {
  fail("Usage: quick_validate_bun.ts <path-to-skill>");
}

const skillName = basename(skillDir);
const skillMd = `${skillDir}/SKILL.md`;

let content: string;
try {
  content = readFileSync(skillMd, "utf8");
} catch (err) {
  fail(`SKILL.md not found at ${skillMd}`);
}

const lines = content.split(/\r?\n/);
if (lines[0] !== "---") {
  fail("SKILL.md is missing YAML frontmatter opening '---'.");
}

let i = 1;
const frontmatter: Record<string, string> = {};
for (; i < lines.length; i += 1) {
  const line = lines[i];
  if (line === "---") break;
  const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
  if (!match) continue;
  frontmatter[match[1]] = match[2];
}

if (i >= lines.length || lines[i] !== "---") {
  fail("SKILL.md is missing YAML frontmatter closing '---'.");
}

if (!frontmatter.name) {
  fail("Frontmatter missing required field: name");
}
if (!frontmatter.description) {
  fail("Frontmatter missing required field: description");
}
if (frontmatter.name !== skillName) {
  fail(`Frontmatter name '${frontmatter.name}' does not match folder '${skillName}'.`);
}

console.log("[OK] Frontmatter looks valid.");
