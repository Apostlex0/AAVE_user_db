export interface TokenConfig {
  address: `0x${string}`;
  decimals: number;
  symbol: string;
}

export const TOKENS: TokenConfig[] = [
  {
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
    symbol: "WETH"
  },
  {
    address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    decimals: 18,
    symbol: "cbETH"
  },
  {
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    decimals: 6,
    symbol: "USDbC"
  },
  {
    address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452",
    decimals: 18,
    symbol: "wstETH"
  },
  {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    symbol: "USDC"
  },
  {
    address: "0x04C0599Ae5A44757c0a6fF9eC3b93da8976c150A",
    decimals: 18,
    symbol: "weETH"
  },
  {
    address: "0xcbB7C0000aB888473b1f5aFd9ef808440eed33Bf",
    decimals: 8,
    symbol: "cbBTC"
  },
  {
    address: "0x2416092f143378750bb29b79eD961ab195cCeea5",
    decimals: 18,
    symbol: "ezETH"
  },
  {
    address: "0x6Bb7a212910682DCfDbd5BCBb3e28FB4E8da10Ee",
    decimals: 18,
    symbol: "GHO"
  },
  {
    address: "0xEDfa23602D0EC14714057867A78d01e94176BEA0",
    decimals: 18,
    symbol: "wrsETH"
  },
  {
    address: "0xecAc9C5F704e954931349Da37F60E39f515c11c1",
    decimals: 8,
    symbol: "LBTC"
  },
  {
    address: "0x60a3E35Cc302bFA44Cb288Bc5aF316Fdb1adb42",
    decimals: 6,
    symbol: "EURC"
  },
];
