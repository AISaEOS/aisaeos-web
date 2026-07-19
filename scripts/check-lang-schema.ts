// Build-time check: the three language files must share an identical key
// structure; arrays must also match in length. Deviations fail the build.
import { readFileSync } from 'node:fs';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

const REFERENCE = 'en.json';
const CANDIDATES = ['de.json', 'fi.json'];

function load(name: string): Json {
  const raw = readFileSync(new URL(`../src/data/${name}`, import.meta.url), 'utf8');
  return JSON.parse(raw) as Json;
}

function kindOf(node: Json): 'object' | 'array' | 'value' {
  if (Array.isArray(node)) return 'array';
  if (node !== null && typeof node === 'object') return 'object';
  return 'value';
}

function joinPath(path: string, key: string): string {
  return path === '' ? key : `${path}.${key}`;
}

function compare(reference: Json, candidate: Json, path: string, issues: string[]): void {
  const referenceKind = kindOf(reference);
  const candidateKind = kindOf(candidate);
  const label = path === '' ? 'root' : path;

  if (referenceKind !== candidateKind) {
    issues.push(`${label}: expected ${referenceKind}, found ${candidateKind}`);
    return;
  }

  if (referenceKind === 'array') {
    const referenceItems = reference as Json[];
    const candidateItems = candidate as Json[];
    if (referenceItems.length !== candidateItems.length) {
      issues.push(
        `${label}: expected array length ${referenceItems.length}, found ${candidateItems.length}`,
      );
      return;
    }
    for (const [index, item] of referenceItems.entries()) {
      const other = candidateItems[index];
      if (other !== undefined) {
        compare(item, other, `${label}[${index}]`, issues);
      }
    }
    return;
  }

  if (referenceKind === 'object') {
    const referenceRecord = reference as { [key: string]: Json };
    const candidateRecord = candidate as { [key: string]: Json };
    for (const key of Object.keys(referenceRecord)) {
      if (!(key in candidateRecord)) {
        issues.push(`${joinPath(path, key)}: missing key`);
      }
    }
    for (const key of Object.keys(candidateRecord)) {
      if (!(key in referenceRecord)) {
        issues.push(`${joinPath(path, key)}: unexpected key`);
      }
    }
    for (const key of Object.keys(referenceRecord)) {
      const candidateValue = candidateRecord[key];
      const referenceValue = referenceRecord[key];
      if (candidateValue !== undefined && referenceValue !== undefined) {
        compare(referenceValue, candidateValue, joinPath(path, key), issues);
      }
    }
  }
}

const reference = load(REFERENCE);
const issues: string[] = [];

for (const name of CANDIDATES) {
  const fileIssues: string[] = [];
  compare(reference, load(name), '', fileIssues);
  for (const issue of fileIssues) {
    issues.push(`${name}: ${issue}`);
  }
}

if (issues.length > 0) {
  console.error(`Language schema deviates from ${REFERENCE}:`);
  for (const issue of issues) {
    console.error(`  ${issue}`);
  }
  process.exit(1);
}
