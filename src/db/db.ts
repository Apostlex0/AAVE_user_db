import { userAddresses, userMetrics, userTransactions } from "ponder:schema";
import { IndexedEvent, TokenData } from "../types/types";

import { AavePoolABI } from "../../abis/Aave_pool";
import { uiPoolDataProviderAbi } from "../../abis/uiPoolDataProvider";
import { TOKENS } from "../config/tokens"; // Import token configuration

const AAVE_POOL_ADDRESS = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5";
const UI_POOL_DATA_PROVIDER = "0x68100bD5345eA474D93577127C11F39FF8463e93";
const POOL_ADDRESSES_PROVIDER = "0xe20fCBdBfFC4Dd138cE8b2E6FBb6CB49777ad64D";

// Helper function to get token decimals by address
function getTokenDecimals(tokenAddress: string): number {
  const token = TOKENS.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
  return token ? token.decimals : 18; // Default to 18 if not found
}

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

    // Fetch and log user reserves data with prices
    await fetchUserReservesDataWithPrices(context, user);

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

export async function fetchUserReservesDataWithPrices(context: any, user: `0x${string}`) {
  const { client } = context;

  try {
    // Fetch general reserve data (including prices and decimals)
    const [reservesData] = await client.readContract({
      address: UI_POOL_DATA_PROVIDER,
      abi: uiPoolDataProviderAbi,
      functionName: "getReservesData",
      args: [POOL_ADDRESSES_PROVIDER]
    });

    // Create a map for quick lookup of price and decimals by underlying asset
    const reserveInfoMap = new Map<string, { price: bigint, decimals: number }>();
    reservesData.forEach((reserve: any) => {
      reserveInfoMap.set(reserve.underlyingAsset.toLowerCase(), {
        price: reserve.priceInMarketReferenceCurrency, // Price has 8 decimals
        decimals: Number(reserve.decimals)
      });
    });

    // Fetch user-specific reserve data
    const [userReservesData] = await client.readContract({
      address: UI_POOL_DATA_PROVIDER,
      abi: uiPoolDataProviderAbi,
      functionName: "getUserReservesData",
      args: [POOL_ADDRESSES_PROVIDER, user]
    });

    console.log(`--- User Reserves for ${user} ---`);
    userReservesData.forEach((reserve: any) => {
      const scaledATokenBalance = BigInt(reserve.scaledATokenBalance);
      const scaledVariableDebt = BigInt(reserve.scaledVariableDebt);

      // Condition: Log only if balance or debt is non-zero
      if (scaledATokenBalance === 0n && scaledVariableDebt === 0n) {
        return; // Skip this token if both balances are zero
      }

      const tokenAddress = reserve.underlyingAsset.toLowerCase();
      const info = reserveInfoMap.get(tokenAddress);
      // Find token symbol from TOKENS config
      const tokenConfig = TOKENS.find(t => t.address.toLowerCase() === tokenAddress);
      const tokenSymbol = tokenConfig ? tokenConfig.symbol : 'UNKNOWN'; // Get symbol or default

      if (!info) {
        console.log(`Warning: Could not find reserve info for token ${tokenSymbol} (${tokenAddress})`);
        return;
      }

      const decimals = info.decimals;
      const price = Number(info.price) / 1e8; // Adjust price from 8 decimals
      let divisor = 1e18;

      if (decimals === 6) {
        divisor = 1e6;
      } else if (decimals === 8) {
        divisor = 1e8;
      }

      const actualATokenBalance = Number(scaledATokenBalance) / divisor;
      const actualVariableDebt = Number(scaledVariableDebt) / divisor;

      const balanceUSD = actualATokenBalance * price;
      const debtUSD = actualVariableDebt * price;

      console.log(`Token: ${tokenSymbol} (${reserve.underlyingAsset})`);
      console.log(`  Actual AToken Balance: ${actualATokenBalance.toFixed(6)}`);
      console.log(`  Collateral in USD: ${balanceUSD.toFixed(2)}`);
      console.log(`  Usage as Collateral: ${reserve.usageAsCollateralEnabledOnUser}`);
      console.log(`  Actual Variable Debt: ${actualVariableDebt.toFixed(6)}`);
      console.log(`  Debt USD: ${debtUSD.toFixed(2)}`);
      console.log('---');
    });

  } catch (error) {
    console.error(`Error fetching user reserves data with prices for user ${user}:`, error);
  }
}