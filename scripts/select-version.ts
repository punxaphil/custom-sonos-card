#!/usr/bin/env npx tsx
/**
 * Interactive version selector using bumpp-style prompts
 * Creates a git tag and pushes the commit and tag
 * Does NOT modify package.json
 *
 * Usage:
 *   npx tsx scripts/select-version.ts           # Normal mode
 *   npx tsx scripts/select-version.ts --dry-run # Dry-run mode (no changes)
 */

import { createInterface } from 'readline';
import { execSync } from 'child_process';
import { inc, ReleaseType, valid } from 'semver';

const dryRun = process.argv.includes('--dry-run');

const releaseTypes: ReleaseType[] = ['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease'];

function exec(command: string): string {
  return execSync(command, { encoding: 'utf-8' }).trim();
}

function getLatestVersion(): string {
  try {
    // Get the most recent tag reachable from HEAD
    const latestTag = exec('git describe --tags --abbrev=0');
    if (!latestTag) {
      return '0.0.0';
    }
    return latestTag.replace(/^v/, '');
  } catch {
    return '0.0.0';
  }
}

const currentVersion = getLatestVersion();

function dryExec(command: string, description: string): void {
  if (dryRun) {
    console.log(`[dry-run] Would run: ${command}`);
  } else {
    console.log(description);
    exec(command);
  }
}

function getVersionChoices(current: string) {
  const choices: { name: string; value: string }[] = [];

  for (const type of releaseTypes) {
    const newVersion = inc(current, type);
    if (newVersion) {
      choices.push({
        name: `${type.padEnd(12)} ${newVersion}`,
        value: newVersion,
      });
    }
  }

  choices.push({ name: 'custom', value: 'custom' });
  return choices;
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirm(question: string): Promise<boolean> {
  const answer = await prompt(`${question} (Y/n): `);
  return answer.toLowerCase() !== 'n';
}

function getDefaultChoiceIndex(current: string): number {
  // If current version is a prerelease (has -), suggest prerelease (index 6)
  // Otherwise suggest patch (index 0)
  return current.includes('-') ? 6 : 0;
}

async function selectVersion(): Promise<string> {
  const choices = getVersionChoices(currentVersion);
  const defaultIndex = getDefaultChoiceIndex(currentVersion);
  const defaultChoice = choices[defaultIndex];

  console.log(`\nCurrent version: ${currentVersion}\n`);
  console.log('Select a new version:\n');

  choices.forEach((choice, index) => {
    const marker = index === defaultIndex ? '→' : ' ';
    console.log(`${marker} ${index + 1}) ${choice.name}`);
  });

  console.log('');

  const answer = await prompt(`Enter choice (1-${choices.length}) [${defaultIndex + 1}]: `);
  
  // If empty, use default
  if (answer === '') {
    return defaultChoice.value;
  }
  
  const index = parseInt(answer, 10) - 1;

  if (isNaN(index) || index < 0 || index >= choices.length) {
    console.error('Invalid choice');
    process.exit(1);
  }

  const selected = choices[index];

  if (selected.value === 'custom') {
    const customVersion = await prompt('Enter custom version: ');
    if (!valid(customVersion)) {
      console.error('Invalid semver version');
      process.exit(1);
    }
    return customVersion;
  }

  return selected.value;
}

async function main() {
  if (dryRun) {
    console.log('\n🔍 DRY-RUN MODE - No changes will be made\n');
  }

  // Check for uncommitted changes
  try {
    exec('git diff-index --quiet HEAD --');
  } catch {
    console.error('Error: You have uncommitted changes. Please commit or stash them first.');
    process.exit(1);
  }

  const version = await selectVersion();
  const tag = `v${version}`;

  // Check if tag already exists
  try {
    execSync(`git rev-parse ${tag}`, { encoding: 'utf-8', stdio: 'pipe' });
    console.error(`Error: Tag ${tag} already exists.`);
    process.exit(1);
  } catch {
    // Tag doesn't exist, good to go
  }

  const latestCommit = exec('git log -1 --oneline');
  console.log(`\nLatest commit: ${latestCommit}`);
  console.log(`Will create tag: ${tag}`);
  console.log('Will push commit and tag to origin\n');

  if (!(await confirm('Proceed?'))) {
    console.log('Aborted.');
    process.exit(0);
  }

  // Create tag on latest commit
  dryExec(`git tag ${tag}`, `Creating tag ${tag}...`);

  // Push the commit
  dryExec('git push', 'Pushing commit...');

  // Push the tag
  dryExec(`git push origin ${tag}`, `Pushing tag ${tag}...`);

  if (dryRun) {
    console.log(`\n🔍 [dry-run] Would have created and pushed tag ${tag}`);
  } else {
    console.log(`\n✅ Successfully created and pushed tag ${tag}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
