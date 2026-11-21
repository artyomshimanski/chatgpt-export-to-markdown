// Builds a small, made-up ChatGPT export in test/fixtures/export/: split
// conversation files plus the sectioned_conversations.json decoy. Every
// case the README claims is in here. Run: node test/make-fixture.js
import { mkdir, writeFile } from 'node:fs/promises';

const T = 1763460000; // 2025-11-18T10:00:00Z
const msg = (role, parts, extra = {}) => ({
  author: { role },
  content: { content_type: 'text', parts },
  recipient: 'all',
  metadata: {},
  ...extra,
});
const node = (id, parent, message) => ({ id, parent, children: [], message });

// Edited question: two branches, current_node is on the second.
const edited = {
  id: 'c1', conversation_id: 'c1', title: 'Pricing page copy', create_time: T, update_time: T + 600,
  current_node: 'a2',
  mapping: {
    root: node('root', null, null),
    sys: node('sys', 'root', msg('system', ['You are ChatGPT'], { metadata: { is_visually_hidden_from_conversation: true } })),
    u1: node('u1', 'sys', msg('user', ['Write a pricing headline'])),
    a1: node('a1', 'u1', msg('assistant', ['OLD BRANCH answer'])),
    u2: node('u2', 'sys', msg('user', ['Write a pricing headline for a Chrome extension'])),
    a2: node('a2', 'u2', msg('assistant', ['Save every chat. Free for 10.'])),
  },
};

// Tool call, tool output, hidden context, code reply, image, split assistant reply.
const tools = {
  id: 'c2', conversation_id: 'c2', title: 'Fix a Rust: borrow error #1', create_time: T + 86400, update_time: T + 86400 + 60,
  current_node: 'a3',
  mapping: {
    root: node('root', null, null),
    u1: node('u1', 'root', { author: { role: 'user' }, content: { content_type: 'multimodal_text', parts: [{ asset_pointer: 'file-service://x' }, 'What does this error mean?'] }, recipient: 'all', metadata: {} }),
    hid: node('hid', 'u1', msg('user', ['HIDDEN CONTEXT'], { metadata: { is_visually_hidden_from_conversation: true } })),
    call: node('call', 'hid', { author: { role: 'assistant' }, content: { content_type: 'code', language: 'json', text: '{"q":"rust"}' }, recipient: 'browser', metadata: {} }),
    out: node('out', 'call', { author: { role: 'tool' }, content: { content_type: 'text', parts: ['TOOL OUTPUT'] }, recipient: 'all', metadata: {} }),
    th: node('th', 'out', { author: { role: 'assistant' }, content: { content_type: 'thoughts', thoughts: [] }, recipient: 'all', metadata: {} }),
    a1: node('a1', 'th', msg('assistant', ['Two mutable borrows overlap.'])),
    a2: node('a2', 'a1', { author: { role: 'assistant' }, content: { content_type: 'code', language: 'rust', text: 'let (a, b) = v.split_at_mut(1);' }, recipient: 'all', metadata: {} }),
    a3: node('a3', 'a2', msg('assistant', ['That gives two separate slices.'])),
  },
};

// Same title and day as c1: gets " 2".
const dup = {
  id: 'c3', conversation_id: 'c3', title: 'Pricing page copy', create_time: T + 3600, update_time: T + 3600,
  current_node: 'a1',
  mapping: { root: node('root', null, null), u1: node('u1', 'root', msg('user', ['Shorter, please'])), a1: node('a1', 'u1', msg('assistant', ['Every chat, saved.'])) },
};

// Only hidden and system messages: written nowhere.
const empty = {
  id: 'c4', conversation_id: 'c4', title: 'EMPTY CHAT', create_time: T, update_time: T,
  current_node: 'sys',
  mapping: { root: node('root', null, null), sys: node('sys', 'root', msg('system', ['x'])) },
};

const dir = new URL('./fixtures/export/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL('conversations-000.json', dir), JSON.stringify([edited, tools]));
await writeFile(new URL('conversations-001.json', dir), JSON.stringify([dup, empty]));
await writeFile(new URL('sectioned_conversations.json', dir), JSON.stringify([]));
console.log('fixture written');
