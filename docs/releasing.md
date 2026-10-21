# Releasing

`@josegalre/code-standards-eslint` is published to npm by
[`.github/workflows/publish.yml`](../.github/workflows/publish.yml) on every `v*` tag. The workflow authenticates
with npm trusted publishing (OIDC) and does not use an `NPM_TOKEN` secret.

## One-time setup

1. Make the GitHub repository public. GitHub only issues provenance attestations for public source repositories,
   and that attestation is what renders the "Built and signed on GitHub Actions" badge on npm. Publishing still
   works from a private repository, but without provenance.
2. Publish the package once manually so it exists on the registry. Trusted publishers can only be configured for
   packages that already exist:

   ```sh
   pnpm --dir packages/eslint-config publish --access public
   ```

   This bootstrap version has no provenance.

3. On npmjs.com, open the package settings, go to **Trusted publishing**, add a **GitHub Actions** publisher, and
   set:

   - Organization or user: `JoseGalRe`
   - Repository: `code-standards`
   - Workflow filename: `publish.yml`
   - Allowed actions: enable **npm publish** (new configurations only allow staged publishing by default)

   npm expires a new trusted publisher configuration that does not complete its first successful publish within
   two days.

4. Optionally, after the first OIDC publish succeeds, set **Publishing access** to
   "Require two-factor authentication and disallow tokens".

## Cutting a release

1. Bump `version` in [`packages/eslint-config/package.json`](../packages/eslint-config/package.json) and commit it.
2. Tag the commit with the same version prefixed by `v` and push the tag:

   ```sh
   git tag v0.1.0
   git push origin v0.1.0
   ```

The workflow checks that the tag matches the package version, runs typecheck, tests and the build, then publishes
from `packages/eslint-config` on a GitHub-hosted runner. Re-run the workflow from the Actions UI to retry a failed
run; publish a new version if the package was already uploaded.
