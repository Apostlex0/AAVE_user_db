

import { ponder } from "ponder:registry";
import { SupplyEvent, WithdrawEvent, BorrowEvent, RepayEvent, LiquidationCallEvent } from "./types/types";
import { storeEvent, updateUserMetrics } from "./db/db";
import pLimit from "p-limit";
import * as fs from 'fs';

// Aave Pool contract address


// Function to read addresses from the file
function getAddressesFromFile(filePath: string): `0x${string}`[] {
  const data = fs.readFileSync(filePath, 'utf-8');
  return data
    .split('\n')
    .map(line => line.split(' ')[0] as `0x${string}`)
    .filter(address => address);
}


export function setupEventHandlers() {
  const userAddresses = getAddressesFromFile('./logs/unique_addresses1.txt');
  console.log(`Setting up event handlers for Aave pool contract with ${userAddresses.length} addresses`);

  // Fetch user metrics for all users at the start
  ponder.on("AavePool:setup", async ({ event, context }: { event: any; context: any }) => {
    const limit = pLimit(10); // Number of concurrent address fetches

    try {
      console.log(`Starting initial user metrics sync... Total Users: ${userAddresses.length}`);

      const tasks = userAddresses.map(user =>
        limit(async () => {
          try {
            await updateUserMetrics(context, user);
          } catch (err) {
            console.error(`Error updating metrics for user ${user}:`, err);
          }
        })
      );
      await Promise.all(tasks);
      
      console.log("Finished initial user metrics sync");
    } catch (error) {
      console.error(`[SYNC ERROR] Error fetching user metrics:`, error);
    }
  });

  // Setup event handlers for the pool contract
  ponder.on("AavePool:Supply", async ({ event, context }: { event: SupplyEvent; context: any }) => {
    try {
      await storeEvent(context, {
        type: "Supply",
        user: event.args.user,
        token: "TOKEN", // We'll need to map this from the reserve address
        tokenAddress: event.args.reserve,
        amount: event.args.amount,
        blockNumber: event.block.number,
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash,
        logIndex: event.log.logIndex,
      });

      await updateUserMetrics(context, event.args.user);
    } catch (error) {
      console.error(`Error processing Supply event:`, error);
    }
  });

  ponder.on("AavePool:Withdraw", async ({ event, context }: { event: WithdrawEvent; context: any }) => {
    try {
      await storeEvent(context, {
        type: "Withdraw",
        user: event.args.user,
        token: "TOKEN", // We'll need to map this from the reserve address
        tokenAddress: event.args.reserve,
        amount: event.args.amount,
        blockNumber: event.block.number,
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash,
        logIndex: event.log.logIndex,
      });

      await updateUserMetrics(context, event.args.user);
    } catch (error) {
      console.error(`Error processing Withdraw event:`, error);
    }
  });

  ponder.on("AavePool:Borrow", async ({ event, context }: { event: BorrowEvent; context: any }) => {
    try {
      await storeEvent(context, {
        type: "Borrow",
        user: event.args.user,
        token: "TOKEN", // We'll need to map this from the reserve address
        tokenAddress: event.args.reserve,
        amount: event.args.amount,
        blockNumber: event.block.number,
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash,
        logIndex: event.log.logIndex,
      });

      await updateUserMetrics(context, event.args.user);
    } catch (error) {
      console.error(`Error processing Borrow event:`, error);
    }
  });

  ponder.on("AavePool:Repay", async ({ event, context }: { event: RepayEvent; context: any }) => {
    try {
      await storeEvent(context, {
        type: "Repay",
        user: event.args.user,
        token: "TOKEN", // We'll need to map this from the reserve address
        tokenAddress: event.args.reserve,
        amount: event.args.amount,
        blockNumber: event.block.number,
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash,
        logIndex: event.log.logIndex,
      });

      await updateUserMetrics(context, event.args.user);
    } catch (error) {
      console.error(`Error processing Repay event:`, error);
    }
  });

  ponder.on("AavePool:LiquidationCall", async ({ event, context }: { event: LiquidationCallEvent; context: any }) => {
    try {
      await storeEvent(context, {
        type: "LiquidationCall",
        user: event.args.user,
        token: "TOKEN", // We'll need to map this from the debt asset address
        tokenAddress: event.args.debtAsset,
        amount: event.args.debtToCover,
        blockNumber: event.block.number,
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash,
        logIndex: event.log.logIndex,
      });

      await updateUserMetrics(context, event.args.user);
    } catch (error) {
      console.error(`Error processing LiquidationCall event:`, error);
    }
  });
}

// Call the setupEventHandlers function to register the event handlers
setupEventHandlers();