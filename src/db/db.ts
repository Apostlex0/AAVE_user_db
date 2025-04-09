import { userAddresses, userMetrics, userTransactions } from "ponder:schema";
import { IndexedEvent, TokenData } from "../types/types";
import { Context } from "ponder:registry";
import { MTokenAbi } from "../../abis/MToken";
import { erc20Abi } from "viem";
import { ComptrollerAbi } from "../../abis/Comptroller";
import { AavePoolABI } from "../../abis/Aave_pool";

const COMPTROLLER_ADDRESS = "0xfBb21d0380beE3312B33c4353c8936a0F13EF26C";
const AAVE_POOL_ADDRESS = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5";

/**
 * Core event processing function that handles database operations
 * 
 * This function performs several critical operations:
 * 
 * 1. Transaction Storage:
 *    - Generates unique event IDs using transaction hash and log index
 *    - Stores complete transaction details including amounts and timestamps
 *    - Handles both primary and related addresses (e.g., payer in RepayBorrow events)
 * 
 * 2. User Address Management:
 *    - Maintains a mapping of user addresses to their associated tokens
 *    - Handles address conflicts using onConflictDoNothing
 *    - Tracks relationships between different addresses in complex events
 * 
 * 3. Error Handling:
 *    - Implements comprehensive error catching and logging
 *    - Provides detailed error context for debugging
 *    - Maintains transaction integrity through error recovery
 * 
 * 4. Logging:
 *    - Provides detailed logging for monitoring and debugging
 *    - Tracks successful operations and failures
 *    - Includes relevant context in log messages
 */
export async function storeEvent(context: any, event: IndexedEvent) {
  try {
    const id = `${event.transactionHash}-${event.logIndex}`;

    console.log(`[EVENT PROCESSING] Starting to process event:`, {
      type: event.type,
      user: event.user,
      token: event.token,
      amount: event.amount.toString(),
      blockNumber: event.blockNumber.toString()
    });

    // Store transaction details
    await context.db.insert(userTransactions).values({
      id,
      userAddress: event.user,
      mTokenAddress: event.tokenAddress,
      tokenSymbol: event.token,
      transactionType: event.type,
      amount: event.amount,
      tokenAmount: event.tokenAmount,
      relatedAddress: event.relatedAddress,
      blockNumber: event.blockNumber,
      blockTimestamp: event.blockTimestamp,
      transactionHash: event.transactionHash
    });

    console.log(`[DB] Successfully stored transaction for event ${id}`);

    // Update user address information
    await context.db.insert(userAddresses).values({
      userAddress: event.user,
      tokenSymbol: event.token,
      tokenAddress: event.tokenAddress
    }).onConflictDoNothing();

    console.log(`[DB] Successfully stored user address for ${event.user} with token ${event.token}`);

    // Handle related addresses (e.g., payer in RepayBorrow events)
    if (event.relatedAddress) {
      await context.db.insert(userAddresses).values({
        userAddress: event.relatedAddress,
        tokenSymbol: event.token,
        tokenAddress: event.tokenAddress
      }).onConflictDoNothing();

      console.log(`[DB] Successfully stored related address ${event.relatedAddress} with token ${event.token}`);
    }

    console.log(`[EVENT COMPLETE] Successfully processed ${event.type} event for user ${event.user} with token ${event.token}`);
  } catch (error) {
    console.error(`[DB ERROR] Failed to store event:`, error);
    console.error(`[DB ERROR] Event details:`, {
      type: event.type,
      user: event.user,
      token: event.token,
      amount: event.amount.toString(),
      blockNumber: event.blockNumber.toString()
    });
  }
}

/**
 * Fetches and calculates comprehensive token data for a specific user
 * 
 * This function performs several complex calculations:
 * 
 * 1. Account Snapshot:
 *    - Retrieves current token balance and borrow balance
 *    - Calculates exchange rate for the token
 *    - Handles error codes from the protocol
 * 
 * 2. Collateral Calculations:
 *    - Fetches market listing status and collateral factor
 *    - Determines if the token can be used as collateral
 *    - Calculates collateral value in USD
 * 
 * 3. Price Oracle Integration:
 *    - Retrieves token prices from the protocol's oracle
 *    - Handles different decimal places for price calculations
 *    - Converts token amounts to USD values
 * 
 * 4. Token-Specific Handling:
 *    - Manages different decimal places across tokens
 *    - Handles native and wrapped token variations
 *    - Provides fallback values for edge cases
 * 
 * Returns null if the token is not available or if there are errors
 */
export async function fetchSingleTokenData(
  context: any,
  user: `0x${string}`,
  token: { symbol: string; address: `0x${string}` }
): Promise<TokenData | null> {
  const client = context.client;
  const tokenAddress = token.address;

  try {
    // 1) getAccountSnapshot
    const [errorCode, tokenBalance, borrowBalance, exchangeRate] = await client.readContract({
      address: tokenAddress,
      abi: MTokenAbi,
      functionName: "getAccountSnapshot",
      args: [user],
    });
    if (errorCode !== 0n) return null;

    // 2) compute supplied in underlying
    const suppliedUnderlying = Number(tokenBalance * exchangeRate) / 1e18;

    // 3) get collateral factor
    const [isListed, collateralFactorMantissa] = await client.readContract({
      address: COMPTROLLER_ADDRESS,
      abi: ComptrollerAbi,
      functionName: "markets",
      args: [tokenAddress],
    });
    const isCollateralEnabled = isListed;
    const collateralFactor = isCollateralEnabled ? collateralFactorMantissa : BigInt(0);

    // 4) get price from Oracle
    const oracleAddress = await client.readContract({
      address: COMPTROLLER_ADDRESS,
      abi: ComptrollerAbi,
      functionName: "oracle",
    });
    let price = 0n;
    if (oracleAddress) {
      price = await client.readContract({
        abi: [
          {
            "type": "function",
            "name": "getUnderlyingPrice",
            "stateMutability": "view",
            "inputs": [{ "internalType": "address", "name": "mToken", "type": "address" }],
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }]
          }
        ],
        address: oracleAddress as `0x${string}`,
        functionName: "getUnderlyingPrice",
        args: [tokenAddress],
      });
    }

    // 5) get underlying decimals
    let underlyingDecimals = 18n; // default
    try {
      const underlyingAddress = await client.readContract({
        address: tokenAddress,
        abi: MTokenAbi,
        functionName: "underlying",
      });
      const decimals = await client.readContract({
        address: underlyingAddress,
        abi: erc20Abi,
        functionName: "decimals",
      });
      underlyingDecimals = BigInt(decimals);
    } catch (e) {
      // if this is a native MToken, use default 18 decimals
    }

    // 6) convert to USD
    const priceInUSD = Number(price) / (10 ** (36 - Number(underlyingDecimals)));
    const suppliedUSD = Number(suppliedUnderlying) * priceInUSD / (10 ** Number(underlyingDecimals));
    const borrowedUSD = Number(borrowBalance) * priceInUSD / (10 ** Number(underlyingDecimals));

    // 7) compute "collateralFactor * supplied (in USD)"
    const collateralFactorUSD = suppliedUSD * Number(collateralFactor) / 1e18;

    // 8) Return array with all values as floats rounded to 4 decimal places
    return [
      suppliedUSD.toFixed(4),
      borrowedUSD.toFixed(4),
      (Number(collateralFactor) / 1e18).toFixed(4),
      collateralFactorUSD.toFixed(4),
      priceInUSD.toFixed(4)
    ];
  } catch (e) {
    console.error(`Error fetching token data for user ${user} token ${token.symbol}:`, e);
    return null;
  }
}

/**
 * Updates user metrics using the Aave pool's getUserAccountData function
 * This function fetches the user's current position data from the Aave pool contract
 * and updates the database with the latest metrics.
 */
export async function updateUserMetrics(context: any, user: `0x${string}`) {
  try {
    const { client, db } = context;

    // Call getUserAccountData on the Aave pool contract
    const [totalCollateralBase, totalDebtBase, availableBorrowsBase, currentLiquidationThreshold, ltv, healthFactor] = await client.readContract({
      address: AAVE_POOL_ADDRESS,
      abi: AavePoolABI,
      functionName: "getUserAccountData",
      args: [user]
    });

    // Update user metrics in the database
    await db.insert(userMetrics)
      .values({
        userAddress: user,
        totalCollateralBase: (Number(totalCollateralBase)/1e8).toString(),
        totalDebtBase: (Number(totalDebtBase)/1e8).toString(),
        availableBorrowsBase: (Number(availableBorrowsBase)/1e8).toString(),
        currentLiquidationThreshold: currentLiquidationThreshold.toString(),
        ltv: ltv.toString(),
        healthFactor: healthFactor.toString()
      })
      .onConflictDoUpdate({
        target: userMetrics.userAddress,
        set: {
          totalCollateralBase: totalCollateralBase.toString(),
          totalDebtBase: totalDebtBase.toString(),
          availableBorrowsBase: availableBorrowsBase.toString(),
          currentLiquidationThreshold: currentLiquidationThreshold.toString(),
          ltv: ltv.toString(),
          healthFactor: healthFactor.toString()
        }
      });

    console.log(`[DB] Successfully updated metrics for user ${user} with total collateral ${Number(totalCollateralBase)/1e8} and total debt ${Number(totalDebtBase)/1e8}`);
  } catch (error) {
    console.error(`[DB ERROR] Failed to update metrics for user ${user}:`, error);
  }
}