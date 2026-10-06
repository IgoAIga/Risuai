# Personal RisuAI build

This fork keeps personal changes on `personal/risu-customizations`. Its starting
point is upstream tag `v2026.8.250` (`1c03894`). The UI version string in that
upstream release is `2026.8.240`.

## Changes

- Gemini Flash 3.8 model registration and Vertex global routing, based on upstream
  PR #1615: <https://github.com/kwaroran/Risuai/pull/1615>.
- Optional unlimited authenticated storage requests for a single-user Node server.
  Set `RISU_UNLIMITED_STORAGE=1` in the server environment before starting it.
  Authentication remains required; login and proxy limits are unchanged. Without
  this variable, upstream's default storage quota still applies.
- Storage writes respect HTTP 429 Retry-After responses and report HTTP errors.
- CHARX/RISUM module imports show success only after module registration succeeds.
- A compact persona button above the conversation shows the effective user name.
  A valid chat-bound persona takes priority over the globally selected persona;
  a lock marks that binding. Clicking opens the persona selector.
- Opening an unconfigured chat remembers the initial persona using its existing
  `bindedPersona` field. The quick selector now changes only that chat, even when
  already pinned. With no active chat it still selects the global default. Persona
  settings continue to edit the global default. Explicitly unbinding a chat retains
  upstream's global-follow behavior. Changing an avatar preserves its persona ID.
  Older unbound conversations have no reliable persona history; choose their
  intended persona once. Existing bindings and saved chats are not bulk-migrated.

## Validation

```sh
pnpm check
pnpm exec vitest run src/ts/chatPersona.test.ts
pnpm build
node server/node/test-large-import.cjs
```

The import regression check uses synthetic data and temporary loopback servers;
it does not read or write the user's live save directory.

## Updating

Keep `upstream` pointed at `kwaroran/Risuai` and `origin` at this personal fork.
Before updating, stop the live server and back up its entire `save/` directory,
the current build, and any machine-local launch/configuration files. Saves may
contain credentials, so keep those backups private and outside Git.

Fetch upstream tags, create an update branch from `personal/risu-customizations`,
and merge the desired upstream release there. Review conflicts and remove any
personal patch superseded by an upstream fix. Run the validation commands and
check persona display/selection and module imports before deploying the build.
If the new version migrates save data, rollback must restore both the old program
and the matching pre-update save backup.

Commit and push only source, tests, and documentation. User chats, personas,
character cards, assets, keys, certificates, generated builds, and Windows-specific
launch files are not part of this public fork. Machine-local launchers should
continue setting `RISU_UNLIMITED_STORAGE=1` after updates.
