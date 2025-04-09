export const AavePoolABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address"
      }
    ],
    name: "getUserAccountData",
    outputs: [
      {
        internalType: "uint256",
        name: "totalCollateralBase",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "totalDebtBase",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "availableBorrowsBase",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "currentLiquidationThreshold",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "ltv",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "healthFactor",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "user",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "onBehalfOf",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "uint16",
        name: "referralCode",
        type: "uint16"
      }
    ],
    name: "Supply",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "Withdraw",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "user",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "onBehalfOf",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "enum DataTypes.InterestRateMode",
        name: "interestRateMode",
        type: "uint8"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "borrowRate",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "uint16",
        name: "referralCode",
        type: "uint16"
      }
    ],
    name: "Borrow",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "repayer",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "useATokens",
        type: "bool"
      }
    ],
    name: "Repay",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "collateralAsset",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "debtAsset",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "debtToCover",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "liquidatedCollateralAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "liquidator",
        type: "address"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "receiveAToken",
        type: "bool"
      }
    ],
    name: "LiquidationCall",
    type: "event"
  }
] as const;
