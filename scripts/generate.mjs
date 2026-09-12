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
const ARTIFACTS = join(ROOT, "contracts", "out");
const DEPLOYMENTS = join(ROOT, "contracts", "deployments");

/** Chains the package ships. A chain with no deployment record cannot be included. */
const CHAINS = [
  { id: 4663, key: "robinhood", label: "Robinhood Chain" },
  { id: 11155111, key: "sepolia", label: "Sepolia" },
];

/**
 * The contracts worth an ABI, mapped to the artifact that holds it.
 *
 * Not every key in a deployment record belongs here. `weth9` is a third party's contract
 * that happens to be recorded; `tokenDescriptor` and `v3PoolDeployer` are wired once at
 * deploy time and never called by an integrator. What is here is what somebody building on
 * PeddleSwap actually calls.
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

for (const chain of CHAINS) {
  const file = join(DEPLOYMENTS, `${chain.id}.json`);
  if (!existsSync(file)) {
    missingRecords.push(chain.id);
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
 * These are generated, not transcribed, and that is the whole point. Both values also
 * exist as hardcoded constants in Solidity -- `PeddleSwapV2Library.pairFor` and
 * `PoolAddress.POOL_INIT_CODE_HASH` -- because a contract cannot hash its own creation
 * code cheaply. A constant like that goes stale the moment the pair or pool source is
 * touched, or even when only the optimizer settings change, and nothing in a normal build
 * notices: addresses silently start pointing at contracts that do not exist.
 *
 * Deriving them here from the same artifacts the deployed bytecode came from means this
 * package cannot carry a stale hash. `src/initCodeHash.test.ts` then asserts the
 * generated values still equal the ones baked into the Solidity, which turns the SDK into
 * the drift alarm for the contracts rather than another copy to keep in sync.
 */
const HASH_TARGETS = {
  v2Pair: "PeddleSwapV2Pair.sol/PeddleSwapV2Pair.json",
  v3Pool: "PeddleSwapV3Pool.sol/PeddleSwapV3Pool.json",
};

const hashLines = [];
for (const [name, relPath] of Object.entries(HASH_TARGETS)) {
  const full = join(ARTIFACTS, relPath);
  if (!existsSync(full)) {
    console.error(`cannot hash ${name}: missing ${relPath}. Run \`forge build\` in contracts/.`);
    process.exit(1);
  }
  const artifact = JSON.parse(readFileSync(full, "utf8"));
  const creation = artifact.bytecode?.object;
  if (!creation || creation.length < 4) {
    console.error(`cannot hash ${name}: artifact has no creation bytecode`);
    process.exit(1);
  }
  // An unlinked library reference would make the hash meaningless -- it hashes the
  // placeholder, not the code that gets deployed. Neither of these contracts links a
  // library today; if one ever does, fail loudly instead of emitting a wrong address.
  if (creation.includes("__$")) {
    console.error(`cannot hash ${name}: creation bytecode has unlinked library placeholders`);
    process.exit(1);
  }
  hashLines.push(`  ${name}: "${keccak256(creation)}",`);
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
console.log(`abis:      ${abiFiles.length} written`);
if (skipped.length) {
  console.log(`skipped:   ${skipped.length}`);
  for (const s of skipped) console.log(`  - ${s}`);
  console.log("\nA skipped target means the artifact path is wrong or contracts were not built.");
  console.log("Run `forge build` in contracts/ and check the path against contracts/out/.");
}
