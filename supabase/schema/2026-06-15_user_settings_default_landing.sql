-- Add an optional per-user default landing tab to user_settings (the
-- kitchen-sink prefs table). Powers "Make Lumé my home" — a signed-in user can
-- land on the full-page Lumé surface instead of Home on a cold open.
--
-- Nullable: null = no preference, the app's normal default (Home) applies. The
-- JS allowlist-validates the value (currently 'lume'), so a new landing target
-- never needs a coordinated CHECK-constraint migration.
--
-- Idempotent (`if not exists`). Already applied to prod via MCP 2026-06-15.
alter table public.user_settings
  add column if not exists default_landing_tab text;
