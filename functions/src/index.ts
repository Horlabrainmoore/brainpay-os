// functions/src/index.ts
import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import logger from "firebase-functions/logger";
import { fetchFeeEstimates, fetchBlocksLatest, fetchAddress } from "./mempoolClient";
import { PerformanceTrace, WalletActivity, AuditLog } from "./firestoreTypes";

admin.initializeApp();
const db = admin.firestore();

// syncLatestBlock - runs every minute
export const syncLatestBlock = onSchedule({
  schedule: "every 1 minutes",
  timeZone: "UTC",
}, async (event) => {
  logger.log("syncLatestBlock start");
  try {
    const blocks = await fetchBlocksLatest();
    if (Array.isArray(blocks) && blocks.length) {
      const latest = blocks[0];
      const height = latest.height;
      const docRef = db.collection("blocks").doc(String(height));
      await docRef.set({
        height,
        hash: latest.id,
        timestamp: admin.firestore.Timestamp.fromMillis(latest.timestamp * 1000),
        tx_count: latest.tx_count || 0,
        raw: latest,
      }, { merge: true });

      await db.collection("telemetry").doc("current").set({
        latest_block: height,
        latest_block_hash: latest.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      await db.collection("audit_logs").add({
        action: "sync_latest_block",
        actor: "functions.syncLatestBlock",
        metadata: { height },
        createdAt: Date.now(),
      } as AuditLog);
    }
  } catch (e) {
    logger.error("syncLatestBlock error", e);
  }
});

// syncMempoolStats - runs every 1 minute (public API rate limits apply)
export const syncMempoolStats = onSchedule({
  schedule: "every 1 minutes",
  timeZone: "UTC",
}, async (event) => {
  logger.log("syncMempoolStats start");
  try {
    const fees = await fetchFeeEstimates();
    const statsUrl = `${process.env.MEMPOOL_API_BASE || "https://mempool.space"}/api/mempool"; // not all endpoints exist; we store fees at least
    await db.collection("mempool_stats").doc("current").set({
      fastestFee: fees.fastestFee,
      halfHourFee: fees.halfHourFee || null,
      economyFee: fees.economyFee || null,
      raw: fees,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await db.collection("audit_logs").add({
      action: "sync_mempool_stats",
      actor: "functions.syncMempoolStats",
      metadata: { fees },
      createdAt: Date.now(),
    } as AuditLog);
  } catch (e) {
    logger.error("syncMempoolStats error", e);
  }
});

// watchWallets - iterate wallet_watch collection and check addresses
export const watchWallets = onSchedule({
  schedule: "every 1 minutes",
  timeZone: "UTC",
}, async (event) => {
  logger.log("watchWallets start");
  try {
    const snap = await db.collection("wallet_watch").get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const address = data.address as string | undefined;
      if (!address) continue;
      try {
        const addr = await fetchAddress(address);
        const balance = addr.chain_stats?.funded_txo_sum || addr.chain_stats?.balance || addr.chain_stats?.funded_txo_sum || 0;
        const unconfirmed = addr.mempool_stats || null;
        // store activity
        await db.collection("wallet_activity").add({
          wallet: address,
          txid: null,
          amount: balance,
          confirmations: addr.chain_stats?.confirmed_txo_sum || 0,
          timestamp: Date.now(),
        } as WalletActivity);

        // detect changes / alerts (simplified)
        // in production: compare to last known balance, create alert document if changed
      } catch (e) {
        logger.error(`watchWallets failed for ${address}`, e);
      }
    }
    await db.collection("audit_logs").add({
      action: "watch_wallets",
      actor: "functions.watchWallets",
      metadata: { count: snap.size },
      createdAt: Date.now(),
    } as AuditLog);
  } catch (e) {
    logger.error("watchWallets error", e);
  }
});
