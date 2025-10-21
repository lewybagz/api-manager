<!-- ccdf4f35-1a46-427d-9cdd-3baa7f50e42f 533b765d-5329-4316-8376-8266e98139d4 -->
# Funhouse (Chaos Lab) for the Password App

## Overview

Create a hidden "Funhouse" page that showcases funny/interesting UI effects and a main "Break App" prank. The prank gradually degrades only the current user's UI, ending in a full-viewport blackout with a scary message, held until the user clicks a clear "Restore App" button. No network writes, no store mutations, and all state resets on navigate/refresh.

PLAN FOR CLEARING LOCAL STORAGE NATURALLY WHEN THE SUER RESTORES

## Access & Routing

- Route path: `/pw/fun`
- File: `src/pages/FunHousePage.tsx`
- Wrapped by `AuthGuard`, `SubscriptionGuard`, and existing Password app shell (`PasswordLayout`) so it inherits the app chrome when not in blackout.
- No navigation link; access via secret keystroke only.

### Route Wiring

- Update `src/App.tsx` to add a guarded route under the Password app segment.
- Ensure this route is not included in any menu (`Navbar`, `Sidebar`).

## Secret Keystroke (Easter Egg)

- Trigger word: `giggles`
- Scope: enabled on password app routes only.
- Behavior: if the user types `giggles` (outside of text inputs), navigate to `/pw/fun`.
- Implementation: reusable hook `src/utils/useSecretCode.ts` that listens to `keydown`, ignores events when a text input/textarea/contenteditable has focus, and clears buffer on inactivity.

Example (concise) hook API:

```tsx
// useSecretCode.ts (concept)
export function useSecretCode(target: string, onMatch: () => void) {
  // registers window keydown, accumulates letters, ignores when typing in inputs,
  // resets after N seconds or on mismatch, calls onMatch when buffer ends with target.
}
```

Usage locations:

- In `PasswordLayout.tsx` or top-level password app shell so the code works across all password pages.
- On match: `navigate('/pw/fun')`.

## Funhouse Page Structure

- `src/pages/FunHousePage.tsx` renders a playful grid of toggles and mini-widgets:
  - Funny widgets: Shy Button, Matrix Rain, Fake 404/500 modal, “Encrypting everything…” infinite progress, CRT/glitch toggles, cursor particles.
  - A big primary action: "Break App".
- All effects are confined to the page container; they never wrap the global router.

### Components (under `src/components/funhouse/`)

- `BreakAppController.tsx`: orchestrates staged degradation and final blackout; owns local state.
- `BreakOverlay.tsx`: the final full-screen overlay with scary message and the "Restore App" button.
- `GlitchLayer.tsx`: CSS glitch/shake + chromatic aberration filter overlay.
- `MatrixRain.tsx`: canvas-based rain effect with start/stop.
- `ShyButton.tsx`: button that avoids pointer on hover.
- `ChaosControls.tsx`: toggles to enable mini-widgets and effects.

## “Break App” Flow (Staged Degradation)

- All timing/state local to `FunHousePage` (React state); no persistence across navigation.
- A single controller advances through timed stages and can be canceled by "Restore App".

Stages (approximate timeline):

1. Subtle Glitch (0–2s)

   - Slight color shift, text flicker, cursor particle noise.

2. Jitter & Blur (2–5s)

   - Page container wobble, tiny rotation, intermittent blur; buttons jitter.

3. UI Corruption Hints (5–8s)

   - Fake warning toast/modals (SIMULATED) and mock 500 banner (modal only).

4. Lock & Stall (8–10s)

   - Dim overlay with fake spinner and “Attempting recovery…” text; input pointer-events disabled.

5. Blackout (10s+ until user restores)

   - Full-screen black overlay; large alarming message (e.g., “Critical breach detected. Your passwords have been leaked.”) and a prominent “Restore App” button.
   - No automatic reveal; user must click “Restore App”. ESC also restores.

Restore behavior:

- Clicking “Restore App” (or ESC) immediately clears all effects, removes overlays, re-enables pointer events, and returns to the normal Funhouse page.

## Safety & Scoping

- No Firestore/API calls. No store mutations (do not touch `authStore`, `passwordStore`, or encryption flows).
- Effects encapsulated to Funhouse page container or absolutely-positioned overlays within it.
- Blackout overlay disables interaction but never alters router/app state; it’s just rendered above.
- Accessibility: focus is trapped in overlays; screen reader labels; ESC to dismiss final blackout.
- Performance: use `requestAnimationFrame` for animations; stop effects when hidden; avoid layout thrash.

## Integration Details

- Place secret-code hook in `PasswordLayout.tsx` so it only applies to the password app area.
- Ensure `MasterPasswordModal` and any sensitive modals are not impacted: the Funhouse page never renders them; overlays are scoped to the Funhouse route only.
- Tailwind/CSS utilities: add minimal keyframes and filters to `src/index.css` if needed, namespaced (e.g., `.fh-` prefix) to avoid leakage.

## Acceptance Criteria

- Navigating to `/pw/fun` is only possible via typing `giggles` with no focused input on password routes.
- Funhouse page loads without touching global stores or making network calls.
- “Break App” runs staged degradation and ends in a blackout overlay with scary text that persists until the user clicks “Restore App” or presses ESC.
- Restoring returns the page to normal instantly; navigating away or refreshing resets everything.
- No console spam in production; no errors thrown during/after effects.

## QA Checklist

- Desktop and mobile: verify ESC and button restore work, tab focus is trapped in overlays, and scrolling is locked appropriately.
- Verify typing `giggles` while focused in a text input does NOT trigger the page.
- Verify no Firestore/HTTP traffic occurs during effects.
- Verify normal app navigation and encryption features behave identically before and after visiting Funhouse.

### To-dos

- [ ] Create `src/stores/easterEggStore.ts` with localStorage-backed unlock state
- [ ] Add triple-click, long-press, and FIRE-typing clues across UI
- [ ] Wire `/fun` route in `src/App.tsx` behind `ProtectedRoute` and `EggGate`
- [ ] Implement `src/components/auth/EggGate.tsx` with `?unlock=1` dev bypass
- [ ] Create `src/pages/FunHousePage.tsx` with playful components grid
- [ ] Implement `BreakAppSequencer` staged UI degradation and recovery
- [ ] Add scoped `.egg-*` effect classes and import only on page
- [ ] Test unlock flow, route guard, Esc/recovery, no leakage, no network calls