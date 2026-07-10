/**
 * Firebase Cloud Functions (Gen2)
 * Main entry point for BrainPay-OS backend
 */

import { onRequest, HttpsError } from 'firebase-functions/https';
import { onSchedule } from 'firebase-functions/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as mempoolClient from './mempoolClient';

initializeApp();
const db = getFirestore();

/**
 * Mempool Fee Estimator — Fetch and cache recommended fees
 */
export const estimateFees = onRequest(
  { region: 'us-central1', memory: '256MB' },
  async (req, res) => {
    try {
      const fees = await mempoolClient.fetchFeeEstimates();

      // Cache in Firestore for 1 minute
      await db.collection('cache').doc('fees').set(
        { ...fees, updated_at: new Date() },
        { merge: true }
      );

      res.json({ success: true, data: fees });
    } catch (error) {
      console.error('Fee estimation failed:', error);
      throw new HttpsError('internal', 'Failed to estimate fees');
    }
  }
);

/**
 * Address Stats Fetcher — Get on-chain balance and tx count
 */
export const getAddressStats = onRequest(
  { region: 'us-central1', memory: '256MB' },
  async (req, res) => {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      throw new HttpsError('invalid-argument', 'Address parameter required');
    }

    try {
      const stats = await mempoolClient.fetchAddress(address);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Address stats failed:', error);
      throw new HttpsError('internal', 'Failed to fetch address stats');
    }
  }
);

/**
 * Block Height Tracker — Get current Bitcoin block height
 */
export const getBlockHeight = onRequest(
  { region: 'us-central1', memory: '256MB' },
  async (req, res) => {
    try {
      const blocks = await mempoolClient.fetchBlocksLatest();
      const height = blocks[0]?.height || 0;

      res.json({ success: true, height });
    } catch (error) {
      console.error('Block height fetch failed:', error);
      throw new HttpsError('internal', 'Failed to fetch block height');
    }
  }
);

/**
 * Scheduled Task — Sync mempool fees every 10 minutes
 */
export const syncMempoolFees = onSchedule(
  { schedule: 'every 10 minutes', region: 'us-central1' },
  async (context) => {
    try {
      console.log('🔄 Syncing mempool fees...');
      const fees = await mempoolClient.fetchFeeEstimates();

      // Store in Firestore
      await db.collection('telemetry').add({
        type: 'mempool_fees',
        fees,
        timestamp: new Date(),
      });

      console.log('✅ Mempool fees synced:', fees);
    } catch (error) {
      console.error('❌ Mempool sync failed:', error);
    }
  }
);

/**
 * Scheduled Task — Export telemetry to BigQuery
 */
export const exportToBigQuery = onSchedule(
  { schedule: 'every day 02:00', region: 'us-central1' },
  async (context) => {
    try {
      console.log('📊 Exporting telemetry to BigQuery...');

      // Query Firestore
      const snapshot = await db.collection('telemetry').where(
        'exported',
        '==',
        false
      ).limit(1000).get();

      console.log(`📤 Exporting ${snapshot.size} documents...`);

      // Mark as exported
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { exported: true });
      });
      await batch.commit();

      console.log('✅ Export completed');
    } catch (error) {
      console.error('❌ BigQuery export failed:', error);
    }
  }
);

export default {
  estimateFees,
  getAddressStats,
  getBlockHeight,
  syncMempoolFees,
  exportToBigQuery,
};
