/**
 * Deployed contract addresses, per chain.
 *
 * GENERATED FILE -- do not edit. Run `npm run gen` in packages/sdk.
 *
 * Source of truth is the repository itself: addresses from
 * contracts/deployments/<chainId>.json, written by Deploy.s.sol during the broadcast, and
 * ABIs from contracts/out/, the solc output for the bytecode that was actually deployed.
 * Editing this file by hand reintroduces exactly the drift generating it prevents.
 */

import type { Address } from "viem";

export const addresses = {
  /** Robinhood Chain (4663) — deployed at block 61044184. */
  4663: {
    dynamicFeeModule: "0xfDdD380B30479aD23B213C5C6dB32a4F91bcD9A6",
    feeRouter: "0x52F4610119D1f7d4C754547a8Ba4D5421b67131d",
    interfaceMulticall: "0xE59aDc2355C91d39237aD38AF182e53C83629127",
    lockerERC20: "0x681ae73b76Eb17456e3E2af949bC0b323905926B",
    lockerERC721: "0xd34F4d87eDc0AB0Cd6b5a5A36A2677eec15E7299",
    mixedRouteQuoter: "0x615402673390a16026D1CB29daE909C27a3F0ee7",
    positionManager: "0x85073d6b5E40233fEFDA391b7B492737A4637689",
    quoter: "0xc67b2512Fe32A7DAB01A438e36f79492330a8Cad",
    quoterV2: "0xCc25a4Ffe669c0Ad5ba4fCD61fE42a0Fa702fE10",
    swapRouter: "0x58b0e60715E33B2B73288EE126EC25a87f2DcB8e",
    swapRouter02: "0xf50f939b9b4739bdb678Ef4306796935e9A2d4DD",
    tickLens: "0x8Ef9bE8AFbd0aa4CCa709E59c2cbE19469E6B4c2",
    tokenDescriptor: "0xaD5977875e171c14027a1f9FA734AD46d7b7Ae3e",
    tokenFactory: "0x84E2F7d216e0c579e3D2236E14E308bD727205CD",
    tokenValidator: "0xCB96d54aF83Ae2F46134b1c42c6A08e8450B1aC9",
    v2Factory: "0x5612aEAE68a31f5dD1fb995e2d47B795fEDe8779",
    v2Router: "0x0B35Fa0cf2C58cCf4d26F1E7466b94e18f27F61c",
    v3Factory: "0xd0E25fD59A18f9728E11A04a24CaF0982231cf95",
    v3FeeAdapter: "0x610951B1096868a0841bAC5c5a7dfe1F516015aE",
    v3PoolDeployer: "0x170d0DF8dCb865269C947A928dfE847919E3c181",
    weth9: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
  },
  /** Sepolia (11155111) — deployed at block 11672286. */
  11155111: {
    dynamicFeeModule: "0x07CD540D7c4b3b35DC1BbD9abdDfAD3881DeEAFe",
    feeRouter: "0xA4AA1111969778EeF885331d870Db1aD04479F31",
    interfaceMulticall: "0xD7261Fb88C5103Cf4fd13B7501D3517469A3377d",
    launchpadFee: "0x91579BF0DA052FaeE998D59674c93857a968833F",
    limitOrders: "0x7E213E691193C9a33101D82251b4a68D69604a20",
    lockerERC20: "0xA7981D2968B9CD456D7a9A06F4D9FD7c2bd81213",
    lockerERC721: "0x1Fa345240430F349892D7eAE5d18dE5D07631cA3",
    mixedRouteQuoter: "0x7b0560E6ef0249D31AdbAA6e12eA9168E82ba93e",
    positionManager: "0xaeb4f7C26EFc455BD2B4EF7b3b194F727b0bB41A",
    quoter: "0x9056C039f8B5868c021fd8c3cfB4e7D84C5f7120",
    quoterV2: "0xbbefa4aCc443a4a7F31Ba52eb2aC1776e49aA783",
    swapRouter: "0xf47363e1EBD50d67e0A9E7dD5F82bbBbE4EFea19",
    swapRouter02: "0xfcE4a5C0147A0e2Fb09559A1b714B170D14BBFad",
    tickLens: "0x4f9938AeA7f9A1F6BC012dF4266B24992485a938",
    tokenDescriptor: "0x248c2e3cd0dB4FebD7D2057668DefaE2D31B1621",
    tokenFactory: "0xD12ebD94A0EaA50106EED3336708dfc76e800612",
    tokenValidator: "0x5D845FAB5A6bdd2531b1c82d21F6aEd46a0a8bC8",
    v2Factory: "0x4D5E1F384625a79d6fCb4Eb0873676248341BaF5",
    v2Router: "0x8b1c311CBD77FFeA1AC1a7244A165a50255b0d04",
    v3Factory: "0xc8315d896fa8F2d18778dd4EBb8Bd6BD0d364640",
    v3FeeAdapter: "0xadbE6b884bd92D874267F390b869AFB1864D4701",
    v3PoolDeployer: "0x86fde29494000D7603E945D02E940E9827EE7F00",
    weth9: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  },
} as const satisfies Record<number, Record<string, Address>>;

/** Chain ids this package ships addresses for. */
export type SupportedChainId = keyof typeof addresses;

/** The contracts available on a given chain. Narrower per chain, on purpose. */
export type AddressesFor<C extends SupportedChainId> = (typeof addresses)[C];
