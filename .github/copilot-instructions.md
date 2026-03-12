# General

- After each change: use `npm run deploy` which lints, builds, deploys.
- After each code change, run `npm run deploy` before responding to the user.
- Avoid duplicate code.
- Avoid redundant variables: don't create temporary variables that simply rename another value unless it improves readability or documents intent.
- Prefer direct returns, destructuring, and small helper functions.
- If a variable adds clarity, name it descriptively and keep its scope minimal.
- Files should never be longer than 200 lines.
- Methods should never be longer than 20 lines. Exception for the render() method, which can be up to 50 lines if necessary.
- Never use `eslint-disable` or `/* eslint-disable */` comments to silence linter errors; instead fix the underlying issue
- No jsdoc. No comments needed. Code explains itself
- Prefer composition to inheritance.
- Use constants for fixed values instead of magic numbers or strings.
- Use descriptive variable and function names.
- Avoid side effects in functions. Write pure functions whenever possible.
- No unused code. No unused variables, functions, imports, or exports
- Use copilot code reviews to ensure code quality and adherence to best practices.
- Dependencies should be pinned, and kept up to date with dependabot.
- Make sure to use latest, stable versions of dependencies unless there is a specific reason not to. Those reasons must be documented in an ADR.md file.
- Keep types clean in normal code, extract type definitions to a types.ts if they are complex or used in multiple places.
- Use conventional commits for commit messages.
- Do not use sed/perl/python one-liners or bulk find/replace commands to edit source files. Edit files directly with targeted patches.

# Code structure

- Separate code into logical modules and components. UI in components and sections, types in types.ts, etc. Use utils/ for shared helper functions. Editor related code should be in editor/ folder.

## Architecture layers

- **Components** (`sections/`, `components/`): Lit elements that own a render tree. Should be thin render shells — delegate state and logic to controllers.
- **Controllers** (`*-controller.ts`): Lit Reactive Controllers that own stateful UI logic (reactive state, lifecycle, computed properties). Attached to a host component via `addController`. When a controller exceeds the line limit, extract event handlers and async operations into companion `*-utils.ts` files that take the controller as a parameter.
- **Utils** (`*-utils.ts`, `utils/`): Helper functions. Prefer pure/stateless transforms and calculations. When extracted from a controller to meet the line limit, utils may take the controller as a parameter to dispatch actions or run async operations — but never the component itself.
- **Services** (`services/`): Stateless API wrappers for external I/O (Home Assistant WebSocket calls, media commands). Live on `Store`, know nothing about UI state.
- **Store** (`model/store.ts`): Glues it together — holds config, active player, hass, and service instances. Passed to components via `.store` property.

## Code structure rules

- No other render\*() methods besides render() in components. If you find yourself needing to break up render() into smaller pieces, extract those pieces into separate components.
- Don't pass around whatever can be found in store.ts. Example of what is not ok ".groupingConfig=${groupingConfig}"
- If something could be easily retrieved from store.ts, it should be. Consider adding a helper function in store.ts instead of passing around data. Example:
  - ".notJoinedCount=${store.allMediaPlayers.length - (this.joinedPlayers?.length ?? 0)} .joinedCount=${this.joinedPlayers?.length ?? 0}"
  - can be extracted from store with a store helper function like "getJoinedAndNotJoinedCounts()"
- Avoid multiple dispatches from a component. Example:
  - @select-all=${this.selectAll} @deselect-all=${this.deSelectAll} @select-predefined-group=${(e: CustomEvent) => this.selectPredefinedGroup(e.detail)}
  - Instead, have one dispatch like @grouping-config-change=${(e: CustomEvent) => this.handleGroupingConfigChange(e.detail)} and then handle the logic in the store or a helper function.
- Avoid logic in component attributes, instead extract to a variable above. Example:
  - Instead of <ha-button .disabled=${!this.joinedPlayers || this.joinedPlayers.length === 0}>, extract to a variable like "const hasJoinedPlayers = this.joinedPlayers && this.joinedPlayers.length > 0;" and then use <ha-button .disabled=${!hasJoinedPlayers}>
- add style to top-most component. Example: `sonos-grouping-button {` should be declared in the grouping-button.ts file, not in the parent component. Exception is if some component want to override style.
- keep the html part of render as HTML:y as possible. Prefer using `?hidden` attributes and always-present elements over ternaries (`condition ? html\`...\` : nothing`) and `when()` directives. Example instead of ${applying ? html`<div class="applying"><ha-spinner></ha-spinner></div>` : nothing} you could have a hide attribute on the div and then just do <div class="applying" ?hidden=${!applying}><ha-spinner></ha-spinner></div>
- never extract sub-configs. Example: `const groupingConfig = store.groupingConfig;` instead just use `this.store.config.grouping`. This goes for all sub-configs.
- If files inside components that only have logic (i.e. doesn't extend LitElement), they must be named `*-utils.ts` (pure helpers) or `*-controller.ts` (Reactive Controllers). Example: `grouping-button-utils.ts` for helper functions, `queue-controller.ts` for stateful queue logic.
- Never pass `this` (the component) into utility functions to read/write state. If logic needs component state, it belongs in a controller, not a utils file.
- global/shared types go in root types.ts, component-specific go in <component-name>.types.ts in the same folder as the component. Example: `grouping.types.ts` for ALL types only used by the grouping files. No types in component files, no exceptions.
- Never add empty CSS placeholders (e.g. `css\`\``). If a style block is empty, remove it.
- Do not create or keep Base\* classes for a single consumer. Base classes are only allowed when there are 2+ concrete classes sharing real behavior.
- Do not re-export section-local types from `src/types.ts`. Keep section-local types imported from their own `<section>.types.ts` file.

# Editor Schema

- Config options in the advanced editor are organized by section (Common, Player, Favorites, Groups, Grouping, Volumes, Queue).
- Section-specific config options should be prefixed with the section name (e.g., `playerHideHeader`, `favoritesTitle`).
- In each schema file, configs should be sorted alphabetically by name.
- Exception: "title" config (e.g., `groupsTitle`, `favoritesTitle`) should always be first in its section's schema.

# Adding New Configuration Options

When adding a new configuration option, update ALL of the following:

1. `src/types.ts` - Add the TypeScript interface property
2. `src/editor/schema/*.ts` - Add to the appropriate editor schema for the visual editor
3. `README.md` - Document the option with description and example
4. Component code - Implement the actual functionality

# README

- In the README, each section's YAML config block should have the "title" config on top (e.g., `queueTitle`, `groupsTitle`).

# Sonos specific

- This card is built into two variants: Sonos Card and Maxi Media Player.
- If adding Sonos specific functionality, make sure to use the isSonosCard utility function to differentiate between the two card types.
  - For readme stuff, use ONLY_SONOS_CARD, ONLY_SONOS_CARD_END, and ONLY_SONOS_CARD_START to show/hide docs for different cards.
  - Study the README.md and the create_dist script for more information.

# Upstream folder

- The `src/upstream/` folder contains code adapted from Home Assistant frontend's media browser.
- Current upstream version tracked in `src/upstream/.upstream-version`
- **AVOID modifying files in `src/upstream/` directly** - extract custom logic to `src/utils/` instead.
- Key customizations in `ha-media-player-browse.ts`:
  - `@ts-nocheck` at top
  - Custom element renamed to `sonos-ha-media-player-browse`
  - `itemsPerRow` property for grid layout control
  - `filterOutIgnoredMediaSources()` wrapper (from `media-browse-utils.ts`)
  - Smaller play buttons (40px vs 70px)
  - Import paths rewritten to local stubs

## Checking for upstream updates

1. Check latest HA frontend release: https://github.com/home-assistant/frontend/releases
2. Download and diff each upstream file:

   ```bash
   # Files to check (old version → new version):
   curl -sf "https://raw.githubusercontent.com/home-assistant/frontend/[OLD]/src/components/media-player/ha-media-player-browse.ts" -o /tmp/old.ts
   curl -sf "https://raw.githubusercontent.com/home-assistant/frontend/[NEW]/src/components/media-player/ha-media-player-browse.ts" -o /tmp/new.ts
   diff /tmp/old.ts /tmp/new.ts

   # Also check: ha-browse-media-manual.ts, ha-browse-media-tts.ts, data/media-player.ts, data/media_source.ts, common/string/slugify.ts
   ```

3. Review diffs and manually apply relevant changes to our local customized versions
4. Update `src/upstream/.upstream-version` with the new version and review notes

# Deployment

- ALWAYS run `npm run deploy` after implementing any code changes (it builds automatically, don't build separately)
- On first run, you'll be prompted to create a long-lived access token in HA (Profile → Long-Lived Access Tokens)
- Navigate to `${HA_URL}${HA_TEST_PAGE}` to verify changes (HA_URL and HA_TEST_PAGE are defined in `.env`)
- When using Playwright to verify changes, navigate to `${HA_URL}${HA_TEST_PAGE}`, use HA_USER and HA_PASSWORD from `.env` for login credentials, and click "Keep me logged in"
- If releasing, use `npx bumpp`
