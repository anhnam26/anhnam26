# Vercel setup for Codex

Verified on 17 October 2026 following
[Vercel's onboarding guide](https://vercel.com/get-started.md).

- CLI: globally installed Vercel `64.4.0`, authenticated as `anhnam26`.
- Guidance: official Vercel plugin `0.21.4`, enabled at user scope.
  The Codex loader found 54 enabled `vercel:*` skills with no marketplace or
  skill loading errors, including `vercel:vercel-cli` and
  `vercel:deployments-cicd`.
- MCP: shared user-wide endpoint `https://mcp.vercel.com`, authenticated with
  OAuth. Both `search_vercel_documentation` and the read-only `list_teams`
  call succeeded. No MCP mutation was needed for verification.
- MCP configuration: `C:\Users\anhna\.codex\config.toml`.
- Project: `anh-nam/anhnam26-live-activity`, linked to this checkout.
  Deployment and public image checks are recorded in
  [live-activity.md](live-activity.md).

The standard plugin installer initially registered `vercel@openai-curated`.
This machine's remote catalog shadowed that local registration, so the actual
Codex loader could not discover its skills. A user-scoped local marketplace
adapter at `C:\Users\anhna\.codex\local-marketplaces\vercel-official`
registers the same official plugin files as `vercel@vercel-official`.
The shadowed registration is disabled. No standalone skill pack was added.

The existing plugins, marketplaces and MCP server settings were preserved.
A fresh Codex app-server loaded and verified the new setup without a model
request. Start a new IDE/Codex session if the current session's tool menu does
not refresh; the verification process did not restart the user's IDE.

Local `.vercel/` project links and `.env*` credentials are ignored by Git and
excluded from deployment source uploads. No credentials are stored in this
document or committed to the repository.
