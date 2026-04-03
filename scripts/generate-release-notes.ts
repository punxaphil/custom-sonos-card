#!/usr/bin/env npx tsx

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

type CategoryKey = 'features' | 'fixes' | 'docs' | 'underTheHood';

type Commit = {
  hash: string;
  title: string;
  category: CategoryKey;
};

function exec(command: string): string {
  return execSync(command, { encoding: 'utf-8' }).trim();
}

function hasArg(name: string): boolean {
  return process.argv.includes(name);
}

function getArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function getCurrentTag(): string {
  const explicitTag = getArgValue('--tag');
  if (explicitTag) {
    return explicitTag;
  }
  const refName = process.env.GITHUB_REF_NAME;
  if (refName) {
    return refName;
  }
  try {
    return exec('git describe --tags --exact-match');
  } catch {
    console.error('Error: Could not determine current tag. Pass --tag <tag>.');
    process.exit(1);
  }
}

function getPreviousTag(currentTag: string): string | undefined {
  try {
    return exec(`git describe --tags --abbrev=0 ${currentTag}^`);
  } catch {
    return undefined;
  }
}

function getCommitRange(currentTag: string, previousTag?: string): string {
  if (!previousTag) {
    return currentTag;
  }
  return `${previousTag}..${currentTag}`;
}

function categorizeCommit(subject: string): { title: string; category: CategoryKey } {
  const match = subject.match(/^(\w+)(?:\([^)]*\))?(!)?:\s+(.+)$/);
  if (!match) {
    return { title: subject, category: 'underTheHood' };
  }

  const [, rawType, , rawTitle] = match;
  const type = rawType.toLowerCase();

  if (type === 'feat') {
    return { title: rawTitle, category: 'features' };
  }
  if (type === 'fix') {
    return { title: rawTitle, category: 'fixes' };
  }
  if (type === 'docs') {
    return { title: rawTitle, category: 'docs' };
  }
  return { title: rawTitle, category: 'underTheHood' };
}

function getCommits(range: string): Commit[] {
  const output = exec(`git log --pretty=format:%H%x09%s ${range}`);
  if (!output) {
    return [];
  }

  return output
    .split('\n')
    .map((line) => {
      const tabIndex = line.indexOf('\t');
      if (tabIndex === -1) {
        return undefined;
      }
      const hash = line.slice(0, tabIndex).trim();
      const subject = line.slice(tabIndex + 1).trim();
      if (!hash || !subject) {
        return undefined;
      }
      const { title, category } = categorizeCommit(subject);
      return { hash, title, category };
    })
    .filter((entry): entry is Commit => !!entry);
}

function getRepoUrl(): string {
  const repo = process.env.GITHUB_REPOSITORY || 'punxaphil/custom-sonos-card';
  return `https://github.com/${repo}`;
}

function buildSection(title: string, commits: Commit[], repoUrl: string): string[] {
  if (commits.length === 0) {
    return [];
  }
  const lines = [title];
  for (const commit of commits) {
    const shortHash = commit.hash.slice(0, 7);
    lines.push(`- ${commit.title} ([${shortHash}](${repoUrl}/commit/${commit.hash}))`);
  }
  lines.push('');
  return lines;
}

function buildReleaseNotes(commits: Commit[]): string {
  if (commits.length === 0) {
    return '- no changes\n';
  }

  const repoUrl = getRepoUrl();
  const sections: string[] = [];

  const features = commits.filter((c) => c.category === 'features');
  const fixes = commits.filter((c) => c.category === 'fixes');
  const docs = commits.filter((c) => c.category === 'docs');
  const underTheHood = commits.filter((c) => c.category === 'underTheHood');

  sections.push(...buildSection('## 🚀 Features', features, repoUrl));
  sections.push(...buildSection('## 🐛 Fixes', fixes, repoUrl));
  sections.push(...buildSection('## 📚 Documentation', docs, repoUrl));
  sections.push(...buildSection('## 🛠 Under the hood', underTheHood, repoUrl));

  return `${sections.join('\n').trim()}\n`;
}

function main(): void {
  const currentTag = getCurrentTag();
  const previousTag = getPreviousTag(currentTag);
  const range = getCommitRange(currentTag, previousTag);
  const commits = getCommits(range);
  const notes = buildReleaseNotes(commits);

  const outputPath = getArgValue('--output');
  if (outputPath) {
    writeFileSync(outputPath, notes, 'utf-8');
    if (hasArg('--print')) {
      process.stdout.write(notes);
    }
    return;
  }

  process.stdout.write(notes);
}

main();
