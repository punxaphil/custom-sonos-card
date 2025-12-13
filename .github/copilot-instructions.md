# General
- Use ESLint and Prettier for code formatting and linting.
- After every significant change, run `npm run lint -- --fix` to ensure code quality and consistency.
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

# Sonos specific
- This card is built into two variants: Sonos Card and Maxi Media Player. 
- If adding Sonos specific functionality, make sure to use the isSonosCard utility function to differentiate between the two card types. 
  - For readme stuff, use ONLY_SONOS_CARD, ONLY_SONOS_CARD_END, and ONLY_SONOS_CARD_START to show/hide docs for different cards. 
  - Study the README.md and the create_dist script for more information. 
