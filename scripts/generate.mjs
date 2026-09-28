/**
 * Generate the SDK's addresses and ABIs from the repository's own build output.
 *
 * WHY GENERATED AND NOT HAND-WRITTEN
 *
 * `web/src/lib/abis*.ts` holds four files of hand-written ABI fragments. They work, and
 * for an application they are defensible — you only declare what you call. For a package
 * other people compile against they are the wrong source, because a hand-written fragment
 * can drift from the deployed contract and the failure is silent: a read against a
 * mismatched signature decodes to the wrong value or returns nothing, with no revert to
 * notice. Publishing that to somebody else's codebase is the one mistake here that is hard
 * to walk back.
 *
 * `contracts/out/<File>.sol/<Name>.json` is the solc output for the exact bytecode that
 * was deployed. Generating from it means an ABI in this package cannot disagree with the
 * chain unless the contracts are recompiled, and then this file regenerates.
 *
 * Addresses come from `contracts/deployments/<chainId>.json`, which is written by
 * `Deploy.s.sol` during the broadcast — the same file the frontend and the indexer read.
 *
 * WHY THE ADDRESS MAP IS SHAPED PER CHAIN RATHER THAN AS ONE UNION
 *
 * The two chains do not carry the same contracts. `limitOrders` and `launchpadFee` are
 * deployed on Sepolia and absent on Robinhood mainnet; `feeRouterLegacy` and
 * `lockerERC721Legacy` exist only on Sepolia, where a locker has been superseded.
 *
 * A single `Record<string, Address>` type would let `addresses[4663].limitOrders` compile
 * and hand back `undefined` at runtime, which in a transaction builder means an approval
 * or a fill sent to the zero address. Emitting each chain as its own object literal with
 * `as const` makes that a type error instead — the property does not exist on that chain's
 * type, so it cannot be read by accident.
 *
 * Absent keys are OMITTED rather than zeroed, deliberately. A zero address is a value a
 * caller can pass around; a missing property is one the compiler refuses.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { keccak256 } from "viem";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../..");
const OUT_DIR = join(HERE, "..", "src", "generated");
const CONTRACTS = join(ROOT, "contracts");
const ARTIFACTS = join(CONTRACTS, "out");
const DEPLOYMENTS = join(CONTRACTS, "deployments");

/**
 * This package is generated inside the peddleswap monorepo and mirrored to a standalone
 * repository, so it runs in two places that need different behaviour.
 *
 * In the monorepo, `contracts/` is a sibling and generation is the point: it re-reads the
 * artifacts so nothing published can disagree with what was deployed.
 *
 * In the mirror there is no `contracts/` at all, and there cannot be -- the mirror carries
 * only this directory. `src/generated` is committed precisely so that checkout still
 * builds, typechecks and publishes. Regenerating there is not merely unnecessary, it is
 * impossible, and the mirror is downstream of a monorepo push whose pre-push hook already
 * regenerated.
 *
 * The distinction matters more than a missing-file error suggests, so it is drawn
 * explicitly rather than inferred from a failed read:
 *
 *   - `contracts/` absent  -> a standalone checkout. Notice, exit 0, keep what is committed.
 *   - `contracts/` present but `out/` empty -> a monorepo clone that has not been built.
 *     Hard failure, because silently shipping stale generated files from a tree whose
 *     contracts have moved is the exact drift this generator exists to prevent.
 */
if (!existsSync(CONTRACTS)) {
  console.log("no ../../contracts — standalone checkout, keeping the committed src/generated.");
  console.log("Regenerate in the peddleswap monorepo; this directory is a mirror of it.");
  process.exit(0);
}
if (!existsSync(ARTIFACTS)) {
  console.error("contracts/ exists but contracts/out/ does not.");
  console.error("Run `forge build` in contracts/ — refusing to reuse possibly-stale generated files.");
  process.exit(1);
}

/**
 * Chains the package ships. A chain with no deployment record cannot be included.
 *
 * `pending: true` marks a chain that is REGISTERED but not yet deployed: its viem
 * definition ships in src/chains.ts, but there is no contracts/deployments/<id>.json yet.
 * For those a missing record is skipped with a notice instead of failing, and the chain
 * simply does not appear in `addresses` -- so `isSupportedChain(8453)` stays false and
 * `addresses[8453]` stays a compile error until real addresses exist. The moment the
 * deploy writes the record, the next `npm run gen` picks it up with no change here.
 *
 * A chain WITHOUT the flag still hard-fails on a missing record: that is a deployed chain
 * whose record has gone missing, which must never silently drop out of the package.
 *
 * After the Base deploy writes contracts/deployments/8453.json (see README, "Adding a
 * chain after its deploy"): `npm run gen`, add `deploymentBlock[8453]` in src/chains.ts
 * (tsc refuses to build until you do), update the chain lists asserted in
 * src/addresses.test.ts, then `npm run verify:live -- 8453`. Drop `pending` once shipped.
 */
const CHAINS = [
  { id: 4663, key: "robinhood", label: "Robinhood Chain" },
  { id: 11155111, key: "sepolia", label: "Sepolia" },
  // Deployed 2026-09-27: a missing record now fails the build.
  { id: 8453, key: "base", label: "Base" },
  { id: 6714, key: "anubis", label: "Anubis Chain", pending: true },
];

/**
 * Every address this package publishes gets an ABI. No exceptions.
 *
 * An earlier version of this file shipped ABIs only for the contracts an integrator was
 * judged likely to call, and left six addresses with no way to call them. That judgement
 * was wrong in the one place it mattered most: `limitOrders` and `launchpadFee` are the
 * contracts the per-chain address typing exists to protect -- the whole point of making
 * `addresses[4663].limitOrders` a compile error is that `addresses[11155111].limitOrders`
 * should then be usable, and without an ABI it is a dead end. `weth9` was the same
 * mistake for a different reason: wrapping and unwrapping is not an exotic call, it is
 * the first thing anyone does.
 *
 * So the rule is now an invariant rather than a judgement, and `src/addresses.test.ts`
 * asserts it: if a key appears in the published address map, an ABI is exported for it.
 * A documented exception list would have needed the same maintenance and would have gone
 * stale silently.
 */
const ABI_TARGETS = {
  v2Factory: "PeddleSwapV2Factory.sol/PeddleSwapV2Factory.json",
  v2Router: "PeddleSwapV2Router02.sol/PeddleSwapV2Router02.json",
  v3Factory: "PeddleSwapV3Factory.sol/PeddleSwapV3Factory.json",
  swapRouter: "SwapRouter.sol/SwapRouter.json",
  swapRouter02: "SwapRouter02.sol/SwapRouter02.json",
  positionManager: "NonfungiblePositionManager.sol/NonfungiblePositionManager.json",
  quoter: "Quoter.sol/Quoter.json",
  quoterV2: "QuoterV2.sol/QuoterV2.json",
  mixedRouteQuoter: "MixedRouteQuoterV1.sol/MixedRouteQuoterV1.json",
  tickLens: "TickLens.sol/TickLens.json",
  tokenValidator: "TokenValidator.sol/TokenValidator.json",
  interfaceMulticall: "PeddleSwapInterfaceMulticall.sol/PeddleSwapInterfaceMulticall.json",
  dynamicFeeModule: "PeddleSwapV3DynamicFeeModule.sol/PeddleSwapV3DynamicFeeModule.json",
  lockerERC20: "PeddleLockerERC20.sol/PeddleLockerERC20.json",
  lockerERC721: "PeddleLockerERC721.sol/PeddleLockerERC721.json",
  feeRouter: "PeddleFeeRouter.sol/PeddleFeeRouter.json",
  tokenFactory: "PeddleTokenFactory.sol/PeddleTokenFactory.json",
  limitOrders: "PeddleLimitOrders.sol/PeddleLimitOrders.json",
  launchpadFee: "PeddleLaunchpadFee.sol/PeddleLaunchpadFee.json",
  v3FeeAdapter: "PeddleV3PositionFeeAdapter.sol/PeddleV3PositionFeeAdapter.json",
  // PeddleSwapV3TokenDescriptor, not Uniswap's NonfungibleTokenPositionDescriptor --
  // Deploy.s.sol deploys the former and both artifacts exist, so the wrong one would
  // build cleanly and decode nothing.
  tokenDescriptor: "PeddleSwapV3TokenDescriptor.sol/PeddleSwapV3TokenDescriptor.json",
  v3PoolDeployer: "PeddleSwapV3PoolDeployer.sol/PeddleSwapV3PoolDeployer.json",
  // Canonical WETH9. On both chains this address was already deployed by somebody else
  // and is merely recorded, but it is the same well-known contract and the ABI is the
  // same, so there is no reason for a consumer to go and find it elsewhere.
  weth9: "WETH9.sol/WETH9.json",
  // The pool itself is never in a deployment record -- pools are CREATE2-deployed per pair
  // -- but it is the contract an integrator reads most, so its ABI ships anyway.
  v3Pool: "PeddleSwapV3Pool.sol/PeddleSwapV3Pool.json",
  v2Pair: "PeddleSwapV2Pair.sol/PeddleSwapV2Pair.json",
};

/** Not addresses. */
const SKIP_KEYS = new Set(["chainId", "deployBlock"]);
const ZERO = "0x0000000000000000000000000000000000000000";

/**
 * Superseded contracts are recorded in the deploy file but NOT published here.
 *
 * Sepolia's record carries `feeRouterLegacy` and `lockerERC721Legacy`, addresses of
 * contracts that were replaced. They are kept in that file on purpose -- the lockers have
 * no proxy and no admin unlock by design (ADR 0005), so a superseded locker keeps custody
 * of everything locked in it forever, and the address is the only record of where those
 * assets are. Deleting it would strand them.
 *
 * They are still wrong to publish from here, because this package's one promise is that
 * the ABI it ships decodes the address it ships. That does not hold for these:
 * `lockerERC721Legacy` predates the `collectFeeBps` field, so its `getLock` returns six
 * words where `lockerERC721Abi` declares seven. Six decoded against seven throws -- and a
 * consumer batching reads through `multicall({ allowFailure: true })` never sees the throw,
 * just a lock that silently does not exist.
 *
 * The old ABI cannot be generated either: that contract's source is only in git history,
 * not in `contracts/out/`, so there is no artifact to derive it from and nothing here could
 * keep a hand-written copy honest.
 *
 * So the choice is between an address with a matching ABI, an address with a mismatching
 * one, or no address. Migration across a supersession is application logic -- the web app
 * implements it, reading both lockers and routing each withdraw to the contract the lock
 * came from -- and it needs an ABI this package cannot vouch for. Omitting is the only one
 * of the three that keeps the promise.
 */
const LEGACY_KEY = /Legacy$/;

function banner(what) {
  return `/**
 * ${what}
 *
 * GENERATED FILE -- do not edit. Run \`npm run gen\` in packages/sdk.
 *
 * Source of truth is the repository itself: addresses from
 * contracts/deployments/<chainId>.json, written by Deploy.s.sol during the broadcast, and
 * ABIs from contracts/out/, the solc output for the bytecode that was actually deployed.
 * Editing this file by hand reintroduces exactly the drift generating it prevents.
 */
`;
}

function readArtifactAbi(relPath) {
  const full = join(ARTIFACTS, relPath);
  if (!existsSync(full)) return null;
  const artifact = JSON.parse(readFileSync(full, "utf8"));
  return artifact.abi ?? null;
}

// --- addresses -----------------------------------------------------------------------

const chainBlocks = [];
const missingRecords = [];
const pendingChains = [];

for (const chain of CHAINS) {
  const file = join(DEPLOYMENTS, `${chain.id}.json`);
  if (!existsSync(file)) {
    if (chain.pending) pendingChains.push(`${chain.label} (${chain.id})`);
    else missingRecords.push(chain.id);
    continue;
  }
  const record = JSON.parse(readFileSync(file, "utf8"));
  const entries = Object.entries(record)
    .filter(
      ([k, v]) =>
        !SKIP_KEYS.has(k) &&
        !LEGACY_KEY.test(k) &&
        typeof v === "string" &&
        v !== ZERO,
    )
    .sort(([a], [b]) => a.localeCompare(b));

  const lines = entries.map(([k, v]) => `    ${k}: "${v}",`).join("\n");
  chainBlocks.push(
    `  /** ${chain.label} (${chain.id}) — deployed at block ${record.deployBlock}. */\n` +
      `  ${chain.id}: {\n${lines}\n  },`,
  );
}

if (missingRecords.length) {
  console.error(`no deployment record for: ${missingRecords.join(", ")}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

writeFileSync(
  join(OUT_DIR, "addresses.ts"),
  banner("Deployed contract addresses, per chain.") +
    `
import type { Address } from "viem";

export const addresses = {
${chainBlocks.join("\n")}
} as const satisfies Record<number, Record<string, Address>>;

/** Chain ids this package ships addresses for. */
export type SupportedChainId = keyof typeof addresses;

/** The contracts available on a given chain. Narrower per chain, on purpose. */
export type AddressesFor<C extends SupportedChainId> = (typeof addresses)[C];
`,
  "utf8",
);

// --- abis ----------------------------------------------------------------------------

const abiFiles = [];
const skipped = [];

for (const [name, relPath] of Object.entries(ABI_TARGETS)) {
  const abi = readArtifactAbi(relPath);
  if (!abi) {
    skipped.push(`${name} (${relPath})`);
    continue;
  }
  const file = `${name}Abi.ts`;
  writeFileSync(
    join(OUT_DIR, file),
    banner(`ABI for ${name}, from contracts/out/${relPath}.`) +
      `\nexport const ${name}Abi = ${JSON.stringify(abi, null, 2)} as const;\n`,
    "utf8",
  );
  abiFiles.push({ name, file });
}

writeFileSync(
  join(OUT_DIR, "abis.ts"),
  banner("Every generated ABI, re-exported.") +
    "\n" +
    abiFiles.map(({ name, file }) => `export { ${name}Abi } from "./${file.replace(/\.ts$/, ".js")}";`).join("\n") +
    "\n",
  "utf8",
);

// --- create2 init code hashes --------------------------------------------------------

/**
 * The two hashes that let a caller compute a pair or pool address without an RPC call.
 *
 * SOURCE OF TRUTH: the constants the DEPLOYED routers use -- `PeddleSwapV2Library.pairFor`
 * and `PoolAddress.POOL_INIT_CODE_HASH`. A pair or pool address is only useful if it is the
 * one the router computes, and on every live chain those constants reproduce the real pairs
 * (checked 2026-09-28 against a Sepolia pair; the V2 factory's code is byte-identical on
 * 4663, 8453 and 11155111).
 *
 * These used to be hashed from a fresh compile, which is right for V3 but NOT reproducible
 * for the V2 pair: it is solc 0.5.16, whose bytecode carries a metadata hash of the whole
 * build context, and a fresh build of today's unchanged source gives 0x3774... while the
 * deployed pairs (built from the deploy-time cache) are 0x7c8c.... CI then "regenerated" a
 * hash no deployed pair has and refused a correct release.
 *
 * The compiled bytecode is still hashed and compared below, as a warning: a mismatch means
 * a FRESH deploy to a new chain would create pairs the V2 router cannot find. Reconcile the
 * pair build with the library constant before deploying anywhere new.
 */
const HASH_SOURCES = {
  v2Pair: { file: "v2/periphery/libraries/PeddleSwapV2Library.sol", re: /hex'([0-9a-f]{64})'\s*\/\/\s*init code hash/, artifact: "PeddleSwapV2Pair.sol/PeddleSwapV2Pair.json" },
  v3Pool: { file: "v3/periphery/libraries/PoolAddress.sol", re: /POOL_INIT_CODE_HASH\s*=\s*0x([0-9a-f]{64})/, artifact: "PeddleSwapV3Pool.sol/PeddleSwapV3Pool.json" },
};

const hashLines = [];
for (const [name, { file, re, artifact }] of Object.entries(HASH_SOURCES)) {
  const source = readFileSync(join(CONTRACTS, "src", file), "utf8");
  const m = re.exec(source);
  if (!m) {
    console.error(`cannot read the ${name} init code hash from src/${file}`);
    process.exit(1);
  }
  const hash = `0x${m[1]}`;
  hashLines.push(`  ${name}: "${hash}",`);

  const full = join(ARTIFACTS, artifact);
  const creation = existsSync(full) ? JSON.parse(readFileSync(full, "utf8")).bytecode?.object : undefined;
  if (creation && !creation.includes("__$") && keccak256(creation) !== hash) {
    console.warn(
      `warning: ${name}: this build's bytecode hashes to ${keccak256(creation)}, not the deployed ${hash}. ` +
        "Existing chains are unaffected; a fresh deploy to a new chain would not match its router.",
    );
  }
}

writeFileSync(
  join(OUT_DIR, "initCodeHashes.ts"),
  banner("CREATE2 init code hashes, keccak256 of each contract's creation bytecode.") +
    `
export const initCodeHashes = {
${hashLines.join("\n")}
} as const;
`,
  "utf8",
);

console.log(`hashes:    ${hashLines.length} written`);
console.log(`addresses: ${chainBlocks.length} chains`);
if (pendingChains.length) {
  console.log(`pending:   ${pendingChains.join(", ")} -- registered, no deployment record yet`);
}
console.log(`abis:      ${abiFiles.length} written`);
if (skipped.length) {
  console.log(`skipped:   ${skipped.length}`);
  for (const s of skipped) console.log(`  - ${s}`);
  console.log("\nA skipped target means the artifact path is wrong or contracts were not built.");
  console.log("Run `forge build` in contracts/ and check the path against contracts/out/.");
}
