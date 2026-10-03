# Lightbox

[![Claude Code 2.1.288+](https://img.shields.io/badge/Claude%20Code-2.1.288%2B-d97757)](https://code.claude.com)
[![License: MIT](https://img.shields.io/github/license/arihantbansal/claude-lightbox)](LICENSE)

Lightbox is a Claude Code mod that shows the images you paste into the prompt as large previews.

## How it works

- Pasting an image opens a large preview of it above the prompt.
- Typing collapses the preview to a row of thumbnails, one for each pasted image.
- Moving the cursor onto an `[Image #n]` tag, with the arrow keys or a click, opens that image again.
- Sending the prompt clears the previews.

A line above each preview describes the image and how the model will read it:

```
Image #3 · Login page with validation error · 2 of 3 · 2850×1672 · 1.1 MB · sent as 2520×1478 · ~4.8k tokens
```

The "sent as" size appears when Claude will scale the image down before reading it. Lightbox computes that size and the token estimate for the session's model, using the resizing rules in Anthropic's [vision documentation](https://platform.claude.com/docs/en/build-with-claude/vision).

## Captions

Lightbox writes a short caption for each pasted image, so several images are easy to tell apart. It runs `claude -p` in the background with only the Read tool loaded, one image at a time. A caption takes about five seconds and one small model call on your Claude Code account. It appears in the preview's header and under the image's thumbnail.

To turn captions off, set the caption model to `off`.

## Requirements

- Claude Code 2.1.288 or later. The mods API is in early access, and Lightbox reads pasted images from a cache folder that isn't a public API, so a Claude Code update can break it.
- A terminal that supports the kitty graphics protocol, such as Ghostty or kitty. Previews don't render inside tmux.
- macOS or Linux.

## Install

Run these commands in Claude Code:

```
/plugin marketplace add arihantbansal/claude-lightbox
/plugin install lightbox@claude-lightbox
/reload-plugins
```

## Settings

Both settings are in `/config`.

| Setting | Values | Default | Effect |
| --- | --- | --- | --- |
| Collapsed view | `thumbnails`, `none` | `thumbnails` | What stays above the prompt while you type |
| Caption model | `sonnet`, `haiku`, `off` | `sonnet` | The model that writes captions, or `off` for none |

## What it accesses

- Reads the session's pasted images from Claude Code's cache folder under `/tmp/claude-<uid>`, or `CLAUDE_CODE_TMPDIR` when it's set.
- Runs `od` to read each image's dimensions and `id -u` to find the cache folder.
- Runs `claude -p` once per image to write its caption, which sends the image to Anthropic on your Claude Code account. Setting the caption model to `off` stops this.
- Reads the prompt you're typing to find `[Image #n]` tags. It never changes the prompt.

Run `claude plugin validate .claude-plugin/plugin.json` in a clone to list every event Lightbox hooks and every call it makes.

## Development

```
git clone https://github.com/arihantbansal/claude-lightbox
cd claude-lightbox
bun install
claude --plugin-dir .
```

With `--plugin-dir`, Claude Code reloads the mod each time you save a file. It also writes the API types to `.claude-plugin/types/`, which `tsconfig.json` extends, so start a session once before type-checking a fresh clone.

```
bun run check   # Biome, tsc, plugin validation and tests
bun run fix     # Biome formatting and safe fixes
```

## License

[MIT](LICENSE)
