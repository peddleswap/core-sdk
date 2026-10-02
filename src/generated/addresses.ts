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
  /** Base (8453) — deployed at block 51852483. */
  8453: {
    dynamicFeeModule: "0xAda1611232F3369bacba40447Ba5eD853D3597F1",
    feeRouter: "0xe29fe05A54796F0301D7395f98A45DD1fa3025Cf",
    interfaceMulticall: "0x04C144cab58b4aa08A005ff90F5Bb28F798FB89E",
    limitOrders: "0xd8a99B32aCad8c1ddC709E29992cbC19dF34286D",
    lockerERC20: "0x2e03623c495f3912f294bF7cC1598af1110FA28C",
    lockerERC721: "0x8785Da212D634Da92efA6FA5E4a3e5097ebe56C4",
    mixedRouteQuoter: "0x897B8d7a4E461F0713Fa6CD0cC9412985a7f0305",
    positionManager: "0xacDDF4543b0c99e33a851febef0bDdae7E470B24",
    quoter: "0x94C0883ec4A24BD69610bdD408Fd8263119827A2",
    quoterV2: "0x929a2CBb3264B53d32bbB1A345FcB248ec75EDa8",
    swapRouter: "0x37bc0bd4250c334d12D9163c6c499bcB26C138A9",
    swapRouter02: "0xD5F79bA1D2c6441477A8b5b9dC595E8Fb5B6d96d",
    tickLens: "0x6Eee5aaB26301CF0373F67c503C4823EE57913bF",
    tokenDescriptor: "0x4dcBA0BD291e68D9A3A64A8900C4A67Cd1B149d3",
    tokenValidator: "0x2077810Ccd04C7bb6cae66462DdBa8Bc1AE72f33",
    v2Factory: "0x0fC7E9BB0b2F84b33a16F6b985F8e99c4E104cd9",
    v2Router: "0x0482B678A56c65Bb96Aa82576d8B50a178a35613",
    v3Factory: "0x8f5890e843C89a7f963ecdEFF84D0900518AE106",
    v3FeeAdapter: "0xb142dD5163beBc9F4125c4abBfb97f9358973612",
    v3PoolDeployer: "0xFc0bd2e4e1E1d80749Df8865850025E419Fe37Fe",
    weth9: "0x4200000000000000000000000000000000000006",
  },
  /** Arc (5042) — deployed at block 23924352. */
  5042: {
    dynamicFeeModule: "0x7F5fb39ED1f1B150faef55d3868DA142FDaA0A4d",
    feeRouter: "0x7E3dDb385ce7c0492f34b3f2D2eFe6E698486B75",
    interfaceMulticall: "0xd8a99B32aCad8c1ddC709E29992cbC19dF34286D",
    limitOrders: "0x333aD94e8B6FD2C0980681253D6EEc14d0884128",
    lockerERC20: "0x9Dc72C10F210e4C842d086Dc7A153887f6709FE3",
    lockerERC721: "0x3ca4C9F740003bCd7fEbF5d4C7c2956E5860D803",
    mixedRouteQuoter: "0x8785Da212D634Da92efA6FA5E4a3e5097ebe56C4",
    positionManager: "0x897B8d7a4E461F0713Fa6CD0cC9412985a7f0305",
    quoter: "0x04C144cab58b4aa08A005ff90F5Bb28F798FB89E",
    quoterV2: "0xAda1611232F3369bacba40447Ba5eD853D3597F1",
    swapRouter: "0x2077810Ccd04C7bb6cae66462DdBa8Bc1AE72f33",
    swapRouter02: "0xb142dD5163beBc9F4125c4abBfb97f9358973612",
    tickLens: "0x2e03623c495f3912f294bF7cC1598af1110FA28C",
    tokenDescriptor: "0xD5F79bA1D2c6441477A8b5b9dC595E8Fb5B6d96d",
    tokenValidator: "0xe29fe05A54796F0301D7395f98A45DD1fa3025Cf",
    v2Factory: "0x4dcBA0BD291e68D9A3A64A8900C4A67Cd1B149d3",
    v2Router: "0xacDDF4543b0c99e33a851febef0bDdae7E470B24",
    v3Factory: "0x94C0883ec4A24BD69610bdD408Fd8263119827A2",
    v3FeeAdapter: "0x21Fc5C7AA794C5E6e2D09fa1aB0C22009aD8a992",
    v3PoolDeployer: "0x37bc0bd4250c334d12D9163c6c499bcB26C138A9",
    weth9: "0x0482B678A56c65Bb96Aa82576d8B50a178a35613",
  },
} as const satisfies Record<number, Record<string, Address>>;

/** Chain ids this package ships addresses for. */
export type SupportedChainId = keyof typeof addresses;

/** The contracts available on a given chain. Narrower per chain, on purpose. */
export type AddressesFor<C extends SupportedChainId> = (typeof addresses)[C];
