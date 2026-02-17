# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start Vite dev server (HMR)
npm run build    # TypeScript check + Vite production build (tsc -b && vite build)
npm run preview  # Preview production build locally
```

No test runner or linter is configured. The CI build (`npm run build`) is the primary quality gate — it runs `tsc -b` with strict mode before bundling.

## Deployment

Pushes to `main` trigger GitHub Actions (`.github/workflows/deploy.yml`) which runs `npm ci && npm run build` and deploys `dist/` to GitHub Pages. The app is served at `/gorgon-inventory-advisor/` (set via `vite.config.ts` `base`).

## Architecture Overview

This is a **Project Gorgon** (MMORPG) inventory management PWA. Users import JSON exports from the game's Lore Exporter addon, and the app recommends what to keep, sell, gift, craft with, or discard for each item.

### Data Flow

1. **Import** — User drops two JSON files: `Storage` (inventory) and `CharacterSheet` (skills, quests, NPCs). `FileDetector.ts` auto-detects type by `Report` field.
2. **CDN Data** — 9 game data files fetched from `cdn.projectgorgon.com` (`cdn.ts`), cached in IndexedDB for 7 days. The CDN version is pinned in `cdn.ts` (`CDN_VERSION`).
3. **Indexing** — `cdn-indexes.ts` `buildIndexes()` builds ~12 cross-reference `Map`s (`GameDataIndexes`) from raw CDN data. This is the most critical function — it powers all analysis.
4. **Recommendation Engine** — `engine.ts` runs a priority chain per item: user overrides → quest check → equipment scoring → recipe analysis → consumable check → NPC gift check → fallback heuristics.
5. **Persistence** — Dexie (IndexedDB) stores per-character data and CDN cache. Zustand store (`store.ts`) holds runtime state and syncs to/from IndexedDB.

### Key Patterns

- **Path alias**: `@/` maps to `src/` (configured in both `tsconfig.app.json` and `vite.config.ts`)
- **Routing**: `HashRouter` with routes: `/import`, `/dashboard`, `/inventory`, `/inventory/:vault`, `/settings`
- **CDN item keys**: `"item_NNNNN"` in CDN data → `TypeID` is the numeric part. Inventory items use bare `TypeID` numbers. Recipe `ItemCode` fields also use bare numbers.
- **StorageVault normalization**: Items without `StorageVault` (player bags/equipped) get assigned `PLAYER_INVENTORY` sentinel (`'__PlayerInventory__'` from `friendlyNames.ts`)
- **TypeScript**: Strict mode with `noUncheckedIndexedAccess: true` — all indexed access returns `T | undefined`

### Recommendation Engine Priority Chain

The engine (`src/features/recommendations/engine.ts`) evaluates each item through this priority chain (first match wins):

1. **User overrides** — Manual keep/sell decisions stored in Zustand
2. **Quest items** — Cross-referenced against CDN quests + character's `ActiveQuests`
3. **Equipment** — Gear scoring based on build config (primary/support skills), level, rarity
4. **Augments** — Skill-matched against build config
5. **Recipe ingredients** — Checked against CDN recipes the character can craft
6. **Consumables** — Evaluated via CDN item behaviors (`UseVerb`)
7. **NPC gifts** — Cross-referenced against NPC preference keywords and character favor levels
8. **Fallback heuristics** — Name/keyword pattern matching from `fallbackHeuristics.ts`

### State Management

- **Zustand store** (`src/lib/store.ts`): Single store with user data (inventory, character, overrides, build config) and game data (indexes). Actions persist to IndexedDB via `persistToDb()`.
- **IndexedDB** (`src/lib/db.ts`): Three tables — `gameData` (CDN cache), `characters` (per-character state), `settings` (key-value, e.g. last active character).
- **`useAnalyzedInventory` hook**: Memoized — recomputes recommendations only when inventory, character, indexes, build config, overrides, or keep quantities change.

### CDN Data Files

The 9 CDN files (`CDN_FILES` in `cdn.ts`): `items`, `recipes`, `quests`, `skills`, `npcs`, `sources_items`, `storagevaults`, `tsysclientinfo`, `abilities`. Types for each are in `src/types/cdn/`.

### Action Types

11 possible recommendation actions defined in `src/types/recommendations.ts`: KEEP, SELL_SOME, SELL_ALL, DISENCHANT, USE, QUEST, LEVEL_LATER, EVALUATE, INGREDIENT, DEPLOY, GIFT.
