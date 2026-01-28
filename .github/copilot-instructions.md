# General
- Use ESLint and Prettier for code formatting and linting.
- Apply Clean Code™️
- DRY: Avoid duplicate code.
- Avoid redundant variables: don't create temporary variables that simply rename another value unless it improves readability or documents intent.
- Prefer direct returns, destructuring, and small helper functions.
- If a variable adds clarity, name it descriptively and keep its scope minimal.
- Files should never be longer than 100 lines.
- Methods should never be longer than 20 lines.
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
- The `src/upstream/` folder contains code synced from Home Assistant frontend via `scripts/sync-upstream.sh`.
- **AVOID modifying files in `src/upstream/` directly** - every change requires updating the sync script to reapply patches.
- Instead, extract custom logic to `src/utils/` or other folders outside upstream.
- Pass data/callbacks from the component that uses upstream code (e.g., `media-browser.ts` → `ha-media-player-browse.ts`).
- If upstream changes ARE necessary, also update `scripts/sync-upstream.sh` with the corresponding sed commands to reapply the change after syncing.

# Deployment
- ALWAYS run `npm run deploy` after implementing any code changes (it builds automatically, don't build separately)
- On first run, you'll be prompted to create a long-lived access token in HA (Profile → Long-Lived Access Tokens)
- Navigate to `${HA_URL}${HA_TEST_PAGE}` to verify changes (HA_URL and HA_TEST_PAGE are defined in `.env`)
- When using Playwright to verify changes, navigate to `${HA_URL}${HA_TEST_PAGE}`, use HA_USER and HA_PASSWORD from `.env` for login credentials, and click "Keep me logged in"
- When testing configuration changes, edit the test dashboard in ../dashboards/ then run update_dashboards.sh
- If releasing, use `npx bumpp`
