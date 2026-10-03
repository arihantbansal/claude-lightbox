# Lightbox

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

- Claude Code 2.1.288 or later. The mods API is in early access and may change between releases.
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

## Limitations

- Lightbox reads images from the folder where Claude Code caches pastes. That folder isn't a public API, so a Claude Code update can break it.
- In fullscreen mode, Claude Code gives the area above the prompt at most half the terminal's height, which limits the preview's size.
- The Claude desktop app previews pasted images itself, so Lightbox draws only in the terminal.

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
