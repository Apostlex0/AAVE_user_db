/**
 * Schema definition for the Moonwell Protocol indexer
 * This file defines the database structure for tracking user interactions
 * and positions across the protocol.
 */

import { onchainTable, primaryKey } from "ponder";
import { TOKENS } from "./src/tokens";


// Function to create token columns
const createTokenColumns = (t: any) => {
  const columns: Record<string, any> = {};
  TOKENS.forEach(token => {
    columns[token.symbol] = t.jsonb().default([]);
  });
  return columns;
};

/**
 * Table for tracking unique user addresses and their token interactions
 * This table stores all addresses that have interacted with the protocol
 */
export const userAddresses = onchainTable(
  "user_addresses",
  (t) => ({
    userAddress: t.hex().notNull(),
    tokenSymbol: t.text().notNull(), // The symbol of the token the user interacted with
    tokenAddress: t.hex().notNull(), // The address of the token contract
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.userAddress, table.tokenSymbol] }),
  })
);

/**
 * Table for tracking user positions in the protocol
 * Stores current supply, collateral and borrow balances for each user
 */
export const userMetrics = onchainTable(
  "user_metrics",
  (t) => ({
    userAddress: t.hex().notNull(),
    // Aave pool metrics
    totalCollateralBase: t.numeric().default('0'),
    totalDebtBase: t.numeric().default('0'),
    availableBorrowsBase: t.numeric().default('0'),
    currentLiquidationThreshold: t.numeric().default('0'),
    ltv: t.numeric().default('0'),
    healthFactor: t.numeric(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.userAddress] }),
  })
);

/**
 * Table for tracking all user transactions
 * Records every supply, borrow, repay, redeem, and liquidation event
 */
export const userTransactions = onchainTable(
  "user_transactions",
  (t) => ({
    // Unique identifier combining transaction hash and log index
    id: t.text().notNull(),
    userAddress: t.hex().notNull(), // The address of the user
    tokenAddress: t.hex().notNull(), // The token address
    tokenSymbol: t.text().notNull(), // The symbol of the token

    // Transaction details
    transactionType: t.text().notNull(), // Type of transaction (BORROW, REPAY, SUPPLY, etc.)
    amount: t.bigint().notNull(), // Amount involved in the transaction
    interestRateMode: t.bigint(), // Interest rate mode (for borrow/repay)
    useATokens: t.boolean(), // Whether ATokens were used (for repay)
    liquidator: t.hex(), // Address of liquidator (for liquidations)
    debtToCover: t.bigint(), // Amount of debt to cover (for liquidations)
    liquidatedCollateralAmount: t.bigint(), // Amount of collateral liquidated

    // Block information
    blockNumber: t.bigint().notNull(), // Block number of the transaction
    blockTimestamp: t.bigint().notNull(), // Unix timestamp of the block
    transactionHash: t.hex().notNull(), // Hash of the transaction
  }),
  (table) => ({
    // Primary key is the composite ID
    pk: primaryKey({ columns: [table.id] }),
    // Indexes for efficient querying
    userIndex: {
      columns: [table.userAddress]
    },
    tokenIndex: {
      columns: [table.tokenAddress]
    },
    typeIndex: {
      columns: [table.transactionType]
    },
    blockIndex: {
      columns: [table.blockNumber]
    }
  })
);