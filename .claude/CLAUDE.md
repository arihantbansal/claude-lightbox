# claude-lightbox

A Claude Code mod (a plugin of function hooks). Load the `plugin-authoring` skill before changing the hooks module; it has the API and the engine's rules.

- `hooks/register.tsx` is the module `hooks/hooks.json` names. Every engine call lives there: `claude plugin validate` traces `$` statically and refuses `$` passed across an import or into anything but a top-level function declaration in the same file. The other files under `hooks/` are pure logic and drawing, with no `$`.
- The module runs with no Node, no DOM and no npm packages: it can import only this plugin's own files, and reaches everything else through `$`. `package.json` holds dev tools only.
- The API types are `.claude-plugin/types/`, written by Claude Code at each load (git-ignored). Grep `claude-code/index.d.ts` there for an event or `$` method before using it.
- Tests run under `claude plugin test`, which imports from `claude-code/testing`; Vitest can't load the engine.
- `bun run check` runs Biome, tsc, `claude plugin validate` and the tests. Run it before calling a change done. With `marketplace.json` present, `claude plugin validate .` checks only the marketplace, so the script also validates `.claude-plugin/plugin.json`, which covers the hooks module.
