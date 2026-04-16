# Design reference (stripped)

The full **v0 / shadcn** landing template that lived here was removed to avoid maintaining a second Next app, duplicate UI primitives, and heavy deps (Three.js, dozens of Radix components).

**Canonical styling now lives in the real product:**

| What | Where |
|------|--------|
| CSS variables (warm neutrals, light/dark) | `apps/web/app/globals.css` |
| Tailwind theme extensions | `apps/web/tailwind.config.ts` |
| Fonts (Instrument Sans / Serif, JetBrains Mono) | `apps/web/app/layout.tsx` |
| Shared form / field classes | `apps/web/lib/form-classes.ts` |
| Auth card shell | `apps/web/components/auth-page-shell.tsx` |
| shadcn-style `Button` + `cn()` | `apps/web/components/ui/button.tsx`, `apps/web/lib/utils.ts` |

`reference/design-tokens.css` in this folder is a **snapshot** of the token layer for quick visual comparison or Figma handoff—it is not imported by the app.

To reuse a **pattern** from the old template (e.g. marquee, noise overlay, border-sketch), copy the utility from `apps/web/app/globals.css` `@layer utilities` or add a small component under `apps/web/components/`.
