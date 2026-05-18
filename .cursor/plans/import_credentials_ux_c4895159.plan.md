---
name: Import credentials UX
overview: Extend [ImportProjectPage.tsx](src/pages/ImportProjectPage.tsx) with a post-import choice (import more vs open project), per-row categories with a global “apply to all” control, and richer .env parsing that uses nearby comments and keywords to improve key/secret pairing—without changing Firestore paths or `addCredential`/`addProject` contracts beyond passing per-row `category`.
todos:
  - id: post-import-flow
    content: Add success outcome state, ZK post-import panel with navigate(`/project/:id`) vs import-more; implement resetImportForm() clearing env, categories, roleMap, and all top-level inputs (confirm update-mode retention of selected project).
    status: completed
  - id: per-key-categories
    content: Add categoryByKey state, sync from parsed keys, global 'Apply to all' action, per-row selects for key rows, use in addCredential payload.
    status: completed
  - id: parse-comments-heuristics
    content: Extend parse pipeline for leading/inline comments; keyword-based nudges merged into roleMap init; show truncated hints in preview/pairing UI.
    status: completed
  - id: verify-build
    content: Run npm run build; spot-check quoted-value and multi-secret attach behavior unchanged.
    status: completed
isProject: false
---

# Import credentials page improvements

## Context (current behavior)

- Import logic lives in [`src/pages/ImportProjectPage.tsx`](src/pages/ImportProjectPage.tsx): [`parseEnv`](src/pages/ImportProjectPage.tsx) drops any line starting with `#` or `;`; one global `credentialCategory` is passed into every `addCredential` payload (see loop around lines 315–336).
- Successful import today: toast, then `setEnvText("")` only; no navigation.
- Project detail route: [`App.tsx`](src/App.tsx) uses `path="project/:projectId"` → navigate with `useNavigate()` to `/project/${projectId}`.

## 1) Post-import: “import more” vs “open project” + full reset on stay

- After a **successful** import run (`successCount > 0` and the normal completion path, not the early-return “project exists / switch mode” branch), set local UI state instead of only clearing the textarea:
  - **State:** e.g. `importOutcome: null | { projectId: string; failCount: number; successCount: number }` or a small `showPostImportActions` boolean plus `lastImportedProjectId`.
  - **UI:** A compact panel or modal (ZK-styled like other surfaces: `border-zk-border`, `bg-zk-elevated/40`) with:
    - **Open project** → `navigate(`/project/${projectId}`)` (and clear outcome state).
    - **Import more** → reset inputs and close the panel.
  - **“Import more” reset helper:** one function `resetImportForm()` that clears: `envText`, `credentialCategory` (to `"none"`), `roleMap` (to `{}` so the existing `[total]` effect rebuilds defaults), **per-key category map** (new state from item 2), `isParsing`/`isSubmitting` flags as needed, and—per your requirement—**all visible fields**: `projectName`, `projectStatus`, `selectedProjectId`, `importMode` if you want a literal full wipe; **recommended default** for update flow: still clear create fields and env, but **keep** `importMode` + `selectedProjectId` so users can paste another `.env` into the same project without re-selecting (call this out during implementation; easy to switch to “clear everything” if you prefer strict literal).
- Do **not** show this panel when `successCount === 0` (only failures / nothing imported).

## 2) Per-key category + “apply to all”

- **New state:** `categoryByKey: Record<string, string>` (values aligned with `CATEGORY_OPTIONS`).
- **Initialization:** Whenever `parsed` / `total` changes (same effect that resets `roleMap`, or a dedicated `useEffect` keyed on `parsed` keys), merge defaults: for each `entry.key`, if no `categoryByKey[key]`, set from current global default (`credentialCategory`) or `"none"`.
- **Global control:** Keep the existing “Category (all imported rows)” select; add an explicit control next to it, e.g. **“Apply to all rows”** (button) that copies the current global value into every key in `parsed` (and optionally resets per-secret rows to “inherit from key” if you model secrets that way—see below).
- **Per-row UI:**
  - In the **Preview** table, replace the static category cell with a `<select>` bound to `categoryByKey[p.key]` for rows that will become a credential (**role `key`**); for `secret` / `ignore` show `—` or “Uses key’s category” if you want secrets to inherit (simplest: **only `key` rows have a category**; imported credential uses the key row’s category when a secret is attached).
  - Optionally mirror the same select in the **Pair secrets** table for `key` rows only to avoid duplicate edits.
- **`handleImport`:** When building `payload`, set `category: categoryByKey[keyEntry.key] ?? credentialCategory || "none"` (same shape as today).

No changes to [`addCredential`](src/stores/credentialStore.ts) signature expected if it already accepts `category` per credential.

## 3) Smarter parsing: comments + key/secret hints

Refactor parsing into a small pipeline (still colocated in the file unless you prefer [`src/utils/parseEnvImport.ts`](src/utils/parseEnvImport.ts) for tests):

1. **Richer line model** (extend or replace `ParsedEnvEntry`):
   - Keep `key`, `value`.
   - Add optional `leadingComment?: string` (text from consecutive `#`/`;`/`//` comment lines immediately above the assignment).
   - Add optional `inlineComment?: string` (text after `#` or `//` on the same line as `KEY=value`, when stripping does not remove meaning from quoted values—only strip inline comments when the value is unquoted, matching current safety).

2. **Comment collection rules:**
   - While scanning, if a line is a **comment-only** line, accumulate into a buffer until a non-comment `KEY=...` line; attach buffer as `leadingComment` to that entry, then clear buffer.
   - Support `#` and `;` as today; optionally add `//` full-line comments for developer `.env` styles.

3. **Heuristic use (read-only hints for UI + initial `roleMap`):**
   - Add `analyzeComment(text: string): { preferSecret?: boolean; preferKey?: boolean; suggestedBase?: string }` using simple keyword scans (case-insensitive): e.g. `secret`, `private`, `password`, `token`, `client secret` → nudge toward **secret**; `api key`, `public`, `publishable` → nudge **key**.
   - When building initial `roleMap` in the `[total]` effect, **merge** with existing logic (`isLikelySecret` / `isLikelyKey` / `baseName` attach): if comment strongly suggests secret but key name is ambiguous, set role `secret`; if comment suggests public key, force `key`.
   - Optional: if `leadingComment` mentions another env name pattern (e.g. “pairs with `FOO_API_KEY`”), that is higher risk for false positives—**phase 1** can skip cross-name parsing and only use keyword buckets.

4. **Preview UX:** Show a truncated hint (e.g. first line of `leadingComment` / `inlineComment`) in preview or pairing table so users see why a row was classified (plain language, no internal jargon).

**Security:** Do not log raw values; comments may contain sensitive text—truncate in UI.

## Files to touch

- Primary: [`src/pages/ImportProjectPage.tsx`](src/pages/ImportProjectPage.tsx) (parsing, state, UI, navigation).
- Optional: new [`src/utils/parseEnvImport.ts`](src/utils/parseEnvImport.ts) + unit tests if you want deterministic tests for comment attachment and heuristics (recommended if you add non-trivial parsing).

## Verification

- Manual: create project import → success → **Open project** lands on project detail; **Import more** leaves form empty (per your rule) and allows a second paste.
- Manual: update existing project → per-row categories differ in Firestore / UI on credentials list.
- Edge: quoted values with `#` inside quotes must not break (regression on existing `hasQuotes` logic).
- Run `npm run build` after edits.
