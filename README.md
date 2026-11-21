# chatgpt-export-to-markdown

Convert your ChatGPT data export (`conversations.json`) into one Markdown note per chat, ready for Obsidian, Logseq, VS Code or any notes app. One file, Node 20+, no dependencies.

```bash
npx chatgpt-export-to-markdown ~/Downloads/chatgpt-export ~/vault/raw/chatgpt
# 1204 chats from conversations-000.json, conversations-001.json -> ~/vault/raw/chatgpt
```

No terminal? The same conversion runs in your browser, with nothing uploaded: [ChatGPT to Markdown converter](https://chattomarkdown.com/tools/chatgpt-to-markdown/).

## 1. Get your ChatGPT export

1. In ChatGPT, open **Settings → Data controls → Export data** and confirm.
2. OpenAI emails you a link. It can take up to 7 days, and the link works for 24 hours.
3. Unzip the download. If there is a ZIP inside it, unzip that too.

## 2. Convert it

```bash
npx chatgpt-export-to-markdown <export-folder> <output-folder>
```

Or install it once: `npm install -g chatgpt-export-to-markdown`.

## What you get

One file per chat, named by date and title, for example `2025-10-09 Pricing page copy.md`:

```markdown
---
title: "Pricing page copy"
source: ChatGPT
url: https://chatgpt.com/c/68e7...
created: 2025-10-09T08:53:20
updated: 2025-10-09T09:01:40
tags: [ai-chat, chatgpt]
---

## 1 You

Write a pricing headline for a Chrome extension

## 2 ChatGPT

Save every chat. Free for 10.
```

Obsidian shows the frontmatter as properties, so Dataview or Bases can sort and filter every chat. The turns are numbered, so another note can link one exchange: `[[2025-10-09 Pricing page copy#1 You]]`.

## Why not just loop over the JSON?

Each chat in `conversations.json` is a tree, not a list. Every time you edit a message or regenerate an answer, ChatGPT starts a new branch and keeps the old one. The tool starts at `current_node` and walks up the `parent` links, so you get only the version you actually saw.

It also:

- reads every part of a large export (`conversations-000.json`, `-001.json` …) and ignores `sectioned_conversations.json`, which is not the chat list,
- skips hidden system context, tool calls, tool output and "thinking" messages,
- keeps code the assistant wrote as fenced blocks with the language,
- removes characters that break Obsidian links (`/ : # ^ [ ] |`) from file names and numbers duplicate titles,
- skips chats with no visible messages.

Tested with `npm test` on a made-up export that has each of these cases.

## Limits

- Pictures become `*[image]*`. They are in the export as separate files; the [web converter](https://chattomarkdown.com/tools/chatgpt-to-markdown/) copies them next to the notes.
- Times are UTC.
- ChatGPT only. Claude's and Gemini's exports have other formats.
- An export is a snapshot: chats you have after it need a new export.

## Keeping it current

If you'd rather not re-export every month, [Chat to Markdown](https://chattomarkdown.com/) is a Chrome extension I make that saves ChatGPT, Claude, Gemini and other chats as Markdown files in a folder you choose and keeps them updated as the chats continue.

For using these notes as the raw layer of an LLM wiki with Claude Code: [Claude Code + Obsidian: Build Karpathy's LLM Wiki From Your ChatGPT History](https://dev.to/ashimanski/claude-code-obsidian-build-karpathys-llm-wiki-from-your-chatgpt-history-2dbn).

## License

MIT
