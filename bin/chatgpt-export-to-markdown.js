#!/usr/bin/env node
// chatgpt-export-to-markdown: ChatGPT data export -> one Markdown note per chat.
// Usage: chatgpt-export-to-markdown <unzipped-export-folder> <output-folder>
// Node 20+, no dependencies. MIT License.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const USAGE = `Usage: chatgpt-export-to-markdown <export-folder> <output-folder>

  <export-folder>  the unzipped ChatGPT data export (the folder with
                   conversations.json, or conversations-000.json, -001.json...)
  <output-folder>  where the .md notes go, e.g. ~/vault/raw/chatgpt

Get the export in ChatGPT: Settings > Data controls > Export data.
No terminal? Free web version: https://chattomarkdown.com/tools/chatgpt-to-markdown/`;

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
  console.log(USAGE);
  process.exit(0);
}
if (args.includes('-v') || args.includes('--version')) {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  console.log(pkg.version);
  process.exit(0);
}
const [src, out] = args;
if (!src || !out) {
  console.error(USAGE);
  process.exit(1);
}

// conversations.json, or conversations-000.json, -001... in big exports,
// sometimes one folder down (newer exports nest a ZIP: unzip that too).
// The exact name matters: sectioned_conversations.json is not the chat list.
const files = (await readdir(src, { recursive: true }))
  .filter((f) => /(^|[\\/])conversations(-\d+)?\.json$/.test(f)).sort();
if (!files.length) {
  console.error(`No conversations.json (or conversations-000.json...) found in ${src}. Unzip the export first; if it holds another ZIP, unzip that too.`);
  process.exit(1);
}
const chats = [];
for (const f of files) chats.push(...JSON.parse(await readFile(join(src, f), 'utf8')));

// The chat is a tree: every edit or regenerate starts a new branch.
// Walk up from current_node to get only the version you saw last.
function thread(chat) {
  const path = [];
  for (let id = chat.current_node; id && chat.mapping[id]; id = chat.mapping[id].parent) {
    path.unshift(chat.mapping[id].message);
  }
  return path;
}

function text(msg) {
  const c = msg.content ?? {};
  if (c.content_type === 'code') return '```' + (c.language ?? '') + '\n' + c.text + '\n```';
  if (c.content_type !== 'text' && c.content_type !== 'multimodal_text') return ''; // thoughts, tool output...
  return (c.parts ?? []).map((p) => (typeof p === 'string' ? p : '*[image]*')).join('\n\n').trim();
}

const visible = (m) =>
  m && ['user', 'assistant'].includes(m.author?.role) &&
  (m.recipient ?? 'all') === 'all' &&                      // not a call to a tool
  !m.metadata?.is_visually_hidden_from_conversation;       // not hidden context

const day = (t) => new Date(t * 1000).toISOString().slice(0, 10);
const iso = (t) => new Date(t * 1000).toISOString().slice(0, 19);
const safe = (s) => s.replace(/[\\/:*?"<>|#^[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Untitled';

await mkdir(out, { recursive: true });
const used = new Set();
let written = 0;

for (const chat of chats) {
  const turns = [];
  for (const m of thread(chat).filter(visible)) {
    const body = text(m);
    if (!body) continue;
    const who = m.author.role === 'user' ? 'You' : 'ChatGPT';
    if (turns.at(-1)?.who === who) turns.at(-1).body += '\n\n' + body; // merge split replies
    else turns.push({ who, body });
  }
  if (!turns.length) continue;

  const title = chat.title || 'Untitled';
  const start = chat.create_time ?? chat.update_time ?? Date.now() / 1000;
  let name = `${day(start)} ${safe(title)}`;
  for (let i = 2; used.has(name.toLowerCase()); i++) name = `${day(start)} ${safe(title)} ${i}`;
  used.add(name.toLowerCase());

  const note = [
    '---',
    `title: ${JSON.stringify(title)}`,
    'source: ChatGPT',
    `url: https://chatgpt.com/c/${chat.conversation_id ?? chat.id}`,
    `created: ${iso(start)}`,
    `updated: ${iso(chat.update_time ?? start)}`,
    'tags: [ai-chat, chatgpt]',
    '---',
    '',
    // Numbered turns, so a note elsewhere can link the exact exchange: [[note#3 You]]
    ...turns.map((t, i) => `## ${i + 1} ${t.who}\n\n${t.body}\n`),
  ].join('\n');

  await writeFile(join(out, `${name}.md`), note);
  written++;
}
console.log(`${written} chats from ${files.join(', ')} -> ${out}`);
