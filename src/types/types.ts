/**
 * Comprehensive type definitions for protocol events
 * 
 * Each event type represents a specific user action in the protocol:
 * - BorrowEvent: When a user borrows assets from the protocol
 * - RepayBorrowEvent: When a user repays borrowed assets
 * - MintEvent: When a user supplies assets to the protocol
 * - RedeemEvent: When a user withdraws supplied assets
 * - LiquidateBorrowEvent: When a position is liquidated due to health factor issues
 * 
 * Each event type includes relevant parameters such as:
 * - User addresses (borrower, payer, minter, redeemer, liquidator)
 * - Amount information (borrow amount, repay amount, mint amount, etc.)
 * - Protocol state updates (account borrows, total borrows, etc.)
 */


export type RepayBorrowEvent = {
    payer: `0x${string}`;
    borrower: `0x${string}`;
    repayAmount: bigint;
    accountBorrows: bigint;
    totalBorrows: bigint;
};

export type MintEvent = {
    minter: `0x${string}`;
    mintAmount: bigint;
    mintTokens: bigint;
};

export type RedeemEvent = {
    redeemer: `0x${string}`;
    redeemAmount: bigint;
    redeemTokens: bigint;
};

export type LiquidateBorrowEvent = {
    liquidator: `0x${string}`;
    borrower: `0x${string}`;
    repayAmount: bigint;
    mTokenCollateral: `0x${string}`;
    seizeTokens: bigint;
};

/**
 * Supported event types in the protocol
 */
export type EventType = 'Supply' | 'Withdraw' | 'Borrow' | 'Repay' | 'LiquidationCall';

/**
 * Standardized structure for all indexed events
 * Used for consistent event processing and database storage
 */
export interface IndexedEvent {
    type: EventType;
    user: `0x${string}`;
    token: string;
    tokenAddress: `0x${string}`;
    amount: bigint;
    tokenAmount?: bigint;
    relatedAddress?: `0x${string}`;
    blockNumber: bigint;
    blockTimestamp: bigint;
    transactionHash: `0x${string}`;
    logIndex: number;
}

export type TokenData = [string, string, string, string, string]; // [amountSupplied, amountBorrowed, collateralFactor, collateralFactorUSD, priceInUSD]
export type UserPosition = {
    userAddress: `0x${string}`;
    totalAmountSupplied: bigint | null;
    totalAmountBorrowed: bigint | null;
    effectiveBorrowLimit: bigint | null;
    healthFactor: number | null;
} & {
    [key: string]: TokenData | bigint | number | null | `0x${string}` | undefined;
};

export interface PonderEvent {
  id: string;
  args: {
    [key: string]: any;
  };
  log: {
    address: `0x${string}`;
    data: `0x${string}`;
    logIndex: number;
    removed: boolean;
    topics: `0x${string}`[];
  };
  block: {
    number: bigint;
    timestamp: bigint;
  };
  transaction: {
    hash: `0x${string}`;
  };
}

export interface SupplyEvent extends PonderEvent {
  args: {
    reserve: `0x${string}`;
    user: `0x${string}`;
    onBehalfOf: `0x${string}`;
    amount: bigint;
    referralCode: number;
  };
}

export interface WithdrawEvent extends PonderEvent {
  args: {
    reserve: `0x${string}`;
    user: `0x${string}`;
    to: `0x${string}`;
    amount: bigint;
  };
}

export interface BorrowEvent extends PonderEvent {
  args: {
    reserve: `0x${string}`;
    user: `0x${string}`;
    onBehalfOf: `0x${string}`;
    amount: bigint;
    interestRateMode: number;
    borrowRate: bigint;
    referralCode: number;
  };
}

export interface RepayEvent extends PonderEvent {
  args: {
    reserve: `0x${string}`;
    user: `0x${string}`;
    repayer: `0x${string}`;
    amount: bigint;
    useATokens: boolean;
  };
}

export interface LiquidationCallEvent extends PonderEvent {
  args: {
    collateralAsset: `0x${string}`;
    debtAsset: `0x${string}`;
    user: `0x${string}`;
    debtToCover: bigint;
    liquidatedCollateralAmount: bigint;
    liquidator: `0x${string}`;
    receiveAToken: boolean;
  };
}
