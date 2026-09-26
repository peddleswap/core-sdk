# Publishing and mirroring `@peddleswap/sdk`

Two destinations, one source of truth.

| | Where | What it is |
|---|---|---|
| **Package** | [`npmjs.com/package/@peddleswap/sdk`](https://www.npmjs.com/package/@peddleswap/sdk) | What developers install |
| **Mirror** | `github.com/peddles-markets/peddleswap-sdk` | Readable, clonable source + issues |
| **Source of truth** | `peddles-markets/peddleswap` → `packages/sdk` | Where edits happen |

The monorepo has to stay the source of truth: this package's addresses and ABIs are
generated from `contracts/`, and that cannot be done anywhere else. The mirror exists so
someone installing the package can read its source, file an issue about it, and clone it
without also cloning a DEX, an indexer and a Next.js app.

**The mirror is read-only and force-pushed.** Anything committed directly to it is
destroyed on the next sync. That is the one way to lose work with this setup, so it is
said here, in the sync script, and in the mirror's README.

---

## One-time setup

### 1. The npm org and scope

`@peddleswap` is a scoped package, so the scope must exist as an npm org and you must be a
member of it.

```sh
npm login                      # or: npm adduser
npm whoami                     # confirm
npm org ls peddleswap          # confirm you're in the org
```

If the org does not exist yet, create it at <https://www.npmjs.com/org/create> with the
name `peddleswap`. The free tier covers unlimited **public** packages, which is what this
is — `publishConfig.access` is already `public` in `package.json`, because scoped packages
default to private and npm rejects a private publish without a paid plan.

### 2. Create the mirror repository

`gh` is not authenticated on this machine, so this step is yours:

```sh
gh auth login
gh repo create peddles-markets/peddleswap-sdk \
  --public \
  --description "TypeScript SDK for PeddleSwap — addresses, ABIs, chain definitions and CREATE2 pool derivation for Robinhood Chain (4663) and Sepolia. Generated from the deployed contracts."
```

Create it **empty** — no README, no license, no .gitignore. The first sync force-pushes a
complete history and any initial commit would just be overwritten.

### 3. First sync, from here

```sh
sh scripts/sync-sdk-mirror.sh
```

Run from the monorepo root. It refuses to run if `packages/sdk` has uncommitted changes
(`subtree split` reads history, so uncommitted work would be silently missing from the
mirror) or if the generated files are stale, then asks before force-pushing.

Verify the mirror stands on its own — this is worth doing once, because it is the whole
premise of having a mirror:

```sh
git clone https://github.com/peddles-markets/peddleswap-sdk /tmp/sdk-check
cd /tmp/sdk-check && npm install && npx tsc --noEmit && npx vitest run
```

Expect **28 passed, 2 skipped**. The two skips are the init-code-hash comparisons, which
read the Solidity sources and correctly cannot run without `contracts/`. They are skipped
rather than passed, because a green result for a check that did not happen is a lie.

### 4. Repository description, topics and social preview

**Description** (GitHub "About", and it should match what npm shows):

```
TypeScript SDK for PeddleSwap — addresses, ABIs, chain definitions and CREATE2 pool
derivation for Robinhood Chain (4663) and Sepolia. Generated from the deployed contracts.
```

```sh
gh repo edit peddles-markets/peddleswap-sdk   --description "TypeScript SDK for PeddleSwap — addresses, ABIs, chain definitions and CREATE2 pool derivation for Robinhood Chain (4663) and Sepolia. Generated from the deployed contracts."   --homepage "https://www.npmjs.com/package/@peddleswap/sdk"
```

The shorter line in `package.json` is what npm's search results show, and it is deliberately
different — npm truncates around 120 characters, so it drops the chain ids and the CREATE2
detail rather than having them cut mid-word.

**Topics**, which are how anyone finds this on GitHub:

```sh
gh repo edit peddles-markets/peddleswap-sdk --add-topic   peddleswap,robinhood-chain,dex,amm,uniswap,uniswap-v3,viem,ethereum,web3,defi,typescript,abi
```

Same twelve as the `keywords` in `package.json`, on purpose — one list to update, and the
two registries stay consistent.

**Social preview.** `assets/og.png` is the card, 1280×640, GitHub's recommended size.

It cannot be set from a file in the repository — GitHub only reads it from
**Settings → General → Social preview → Upload an image**. That is a manual step and there
is no API or `gh` flag for it, so it is easy to believe it is done because the file is
committed. It is not.

To change the card, edit `assets/og.html` and re-render — never hand-edit the PNG, which
is why the source is committed beside it:

```sh
# from the monorepo root
node scripts/chrome/shot.mjs packages/sdk/assets/og.html packages/sdk/assets/og.png 1280 640 2
```

It renders at 2x for retina and lands around 710 KB, inside GitHub's 1 MB limit. The
palette and type are the brand kit's (the app's `--dark-*` tokens, Exo 2 and JetBrains
Mono), and `assets/wordmark.png` is the kit wordmark copied beside the card, so the card
cannot drift from the app by being redrawn from memory.

`assets/` is not in `files`, so none of this ships in the npm tarball.

### 5. CI secrets

Two repository secrets on the **monorepo** (Settings → Secrets and variables → Actions):

| Secret | What | How |
|---|---|---|
| `MIRROR_TOKEN` | Lets CI push to the mirror | Fine-grained PAT, **Contents: write** on `peddleswap-sdk` only |
| `NPM_TOKEN` | Lets CI publish | npm **Automation** token |

Both of these have a trap in them:

- The default `GITHUB_TOKEN` is scoped to the repository the workflow runs in and **cannot
  push to another repo**. That is why `MIRROR_TOKEN` exists at all. Scope the PAT to the
  mirror and to `Contents: write` — nothing else, and not the monorepo.
- npm has two token types that both look right. A **Publish** token still demands 2FA and
  will hang a CI run until it times out. Use **Automation**, which is exempt. Create it at
  <https://www.npmjs.com/settings/~/tokens> → Generate New Token → Classic → Automation.

---

## Releasing a version

Versions are published by tag, so a release is an explicit, reviewable act.

```sh
cd packages/sdk
npm version patch        # or minor / major — edits package.json and commits
cd ../..
git push
git tag sdk-v0.1.1
git push origin sdk-v0.1.1
```

`.github/workflows/sdk-publish.yml` takes it from there: it builds the contracts, proves
the committed generated files match them, and publishes. It **fails** if the tag and
`package.json` disagree — otherwise npm quietly publishes the manifest's version and you
are left with a tag pointing at a release that does not exist.

### Publishing by hand instead

```sh
cd packages/sdk
npm run verify:live      # 29 checks on 4663, 33 on Sepolia — needs network
npm publish --access public
```

`prepublishOnly` regenerates, typechecks, tests and builds first, so the tarball cannot
disagree with the tree it was published from. Run `verify:live` yourself — it is not in
`prepublishOnly` because it needs network access, and a publish that fails on a bad RPC
minute is a publish people learn to retry blindly.

### What actually ships

```sh
npm pack --dry-run
```

Nine files: `dist/` (ESM, CJS, both sets of type declarations, source maps),
`package.json`, `README.md`, `LICENSE`. No sources, no scripts, no tests — `files` in
`package.json` is the allowlist.

---

## Versioning

This package's version tracks **the shape of its API**, not the deployments.

That distinction matters because a redeploy changes addresses without changing a single
signature. Consumers pin a version to get a stable API; they read `addresses` at runtime
to find out where things are.

| Change | Bump |
|---|---|
| New contract, new export, new chain | **minor** |
| Address changes after a redeploy | **minor** — it is a behaviour change, and silently shipping new addresses in a patch is how someone's pinned lockfile starts pointing at a dead factory |
| Regenerated ABI, same signatures | patch |
| A removed export, a renamed address key, a changed function signature | **major** |
| Docs, comments, tests | patch |

## Enabling npm provenance

`sdk-publish.yml` does not pass `--provenance`, and the reason is written where the flag
would go: npm can only attest a **public** source repository. On a private monorepo the
publish fails outright, and a release workflow that breaks the first time it is used is
worse than one without an attestation.

Once `peddles-markets/peddleswap` is public, add `--provenance` to the `npm publish` line.
The `id-token: write` permission the workflow already declares is the other half of what
it needs.

## If the mirror and the monorepo disagree

They cannot, in the direction that matters — the mirror is a projection. Re-run the sync
and the mirror matches again:

```sh
sh scripts/sync-sdk-mirror.sh
```

If someone has committed to the mirror directly, that work exists **only** there and the
next sync destroys it. Recover it before syncing. Run the split locally and compare: any
mirror commit that is not in the split output is one that exists nowhere else.

```sh
# in the monorepo
SPLIT=$(git subtree split --prefix=packages/sdk HEAD | tail -1)

git clone https://github.com/peddles-markets/peddleswap-sdk /tmp/rescue
cd /tmp/rescue
git fetch ../path/to/peddleswap "$SPLIT"
git log --oneline FETCH_HEAD..origin/main     # commits only the mirror has
```

Port anything that turns up into `peddleswap/packages/sdk`, then sync. A force-push is
still the right mechanism here — the alternative is two histories that both claim to be
the package, which is worse than one that is explicitly a projection.
