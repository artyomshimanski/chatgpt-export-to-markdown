import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/chatgpt-export-to-markdown.js', import.meta.url));
const fixture = fileURLToPath(new URL('./fixtures/export/', import.meta.url));

const out = mkdtempSync(join(tmpdir(), 'cgpt-md-'));
const log = execFileSync(process.execPath, [cli, fixture, out], { encoding: 'utf8' });
const files = readdirSync(out).sort();
const read = (name) => readFileSync(join(out, name), 'utf8');

test('reads the split files, not sectioned_conversations.json', () => {
  assert.match(log, /3 chats from conversations-000\.json, conversations-001\.json/);
  assert.doesNotMatch(log, /sectioned/);
});

test('one note per chat with messages; empty chats are skipped', () => {
  assert.deepEqual(files, [
    '2025-11-18 Pricing page copy 2.md',
    '2025-11-18 Pricing page copy.md',
    '2025-11-19 Fix a Rust borrow error 1.md',
  ]);
});

test('keeps only the branch you saw, with numbered turns and frontmatter', () => {
  const note = read('2025-11-18 Pricing page copy.md');
  assert.match(note, /^---\ntitle: "Pricing page copy"\nsource: ChatGPT\nurl: https:\/\/chatgpt\.com\/c\/c1\n/);
  assert.match(note, /## 1 You\n\nWrite a pricing headline for a Chrome extension\n/);
  assert.match(note, /## 2 ChatGPT\n\nSave every chat\. Free for 10\./);
  assert.doesNotMatch(note, /OLD BRANCH|You are ChatGPT/);
});

test('skips hidden context, tool calls, tool output and thinking; keeps code and images', () => {
  const note = read('2025-11-19 Fix a Rust borrow error 1.md');
  assert.doesNotMatch(note, /HIDDEN CONTEXT|TOOL OUTPUT|"q":"rust"/);
  assert.match(note, /## 1 You\n\n\*\[image\]\*\n\nWhat does this error mean\?/);
  assert.match(note, /```rust\nlet \(a, b\) = v\.split_at_mut\(1\);\n```/);
  assert.match(note, /## 2 ChatGPT\n\nTwo mutable borrows overlap\.\n\n```rust/);
  assert.doesNotMatch(note, /## 3/);
});

test('--help and a missing argument print usage', () => {
  assert.match(execFileSync(process.execPath, [cli, '--help'], { encoding: 'utf8' }), /^Usage: chatgpt-export-to-markdown/);
  assert.throws(() => execFileSync(process.execPath, [cli], { stdio: 'pipe' }), /Usage/);
});
