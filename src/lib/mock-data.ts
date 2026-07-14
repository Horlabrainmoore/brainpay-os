// Mock data for BrainPay OS

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'trade' | 'payment';
  amount: number;
  currency: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  route?: 'card' | 'crypto';
  txid?: string;
}

export interface Wallet {
  id: string;
  name: string;
  symbol: string;
  address: string;
  balance: number;
  usdValue: number;
  change24h: number;
  icon: string;
}

export interface TradeSignal {
  id: string;
  pair: string;
  type: 'buy' | 'sell' | 'hold';
  confidence: number;
  price: number;
  timestamp: string;
  aiReason: string;
  riskScore: number;
}

export interface AIInsight {
  id: string;
  type: 'trade' | 'route' | 'risk' | 'alert';
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  action?: string;
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  category: string;
  message: string;
  timestamp: string;
  details?: string;
}

export const wallets: Wallet[] = [
  { id: '1', name: 'Bitcoin', symbol: 'BTC', address: '0x1a2b...9f3e', balance: 1.4523, usdValue: 94521.30, change24h: 2.34, icon: '₿' },
  { id: '2', name: 'Ethereum', symbol: 'ETH', address: '0x4c5d...7a8b', balance: 12.8901, usdValue: 41893.45, change24h: -1.12, icon: 'Ξ' },
  { id: '3', name: 'USD Coin', symbol: 'USDC', address: '0x9e0f...2c3d', balance: 25000.00, usdValue: 25000.00, change24h: 0.01, icon: '$' },
  { id: '4', name: 'Solana', symbol: 'SOL', address: '0x6g7h...4i5j', balance: 234.56, usdValue: 35184.00, change24h: 5.67, icon: '◎' },
];

export const recentTransactions: Transaction[] = [
  { id: '1', type: 'receive', amount: 0.25, currency: 'BTC', description: 'Deposit from external', timestamp: '2026-04-14T10:30:00Z', status: 'completed', route: 'crypto' },
  { id: '2', type: 'payment', amount: 149.99, currency: 'USD', description: 'SaaS subscription payment', timestamp: '2026-04-14T09:15:00Z', status: 'completed', route: 'card' },
  { id: '3', type: 'trade', amount: 2.5, currency: 'ETH', description: 'AI auto-trade: ETH/USDC', timestamp: '2026-04-14T08:45:00Z', status: 'completed', route: 'crypto' },
  { id: '4', type: 'send', amount: 500, currency: 'USDC', description: 'Payment to vendor', timestamp: '2026-04-13T16:20:00Z', status: 'pending', route: 'crypto' },
  { id: '5', type: 'payment', amount: 89.00, currency: 'USD', description: 'Cloud hosting bill', timestamp: '2026-04-13T14:00:00Z', status: 'completed', route: 'card' },
  { id: '6', type: 'trade', amount: 0.1, currency: 'BTC', description: 'Manual trade: BTC/USD', timestamp: '2026-04-13T11:30:00Z', status: 'completed', route: 'crypto' },
  { id: '7', type: 'receive', amount: 1000, currency: 'USDC', description: 'Client payment received', timestamp: '2026-04-12T18:00:00Z', status: 'completed', route: 'crypto' },
  { id: '8', type: 'payment', amount: 299.99, currency: 'USD', description: 'Hardware purchase', timestamp: '2026-04-12T10:00:00Z', status: 'failed', route: 'card' },
];

export const tradeSignals: TradeSignal[] = [
  { id: '1', pair: 'BTC/USDC', type: 'buy', confidence: 87, price: 65120.50, timestamp: '2026-04-14T10:00:00Z', aiReason: 'RSI oversold + whale accumulation detected', riskScore: 32 },
  { id: '2', pair: 'ETH/USDC', type: 'sell', confidence: 72, price: 3250.80, timestamp: '2026-04-14T09:30:00Z', aiReason: 'Bearish divergence on 4H chart', riskScore: 58 },
  { id: '3', pair: 'SOL/USDC', type: 'buy', confidence: 91, price: 150.20, timestamp: '2026-04-14T08:00:00Z', aiReason: 'Breakout above key resistance with volume', riskScore: 25 },
  { id: '4', pair: 'BTC/USDC', type: 'hold', confidence: 65, price: 64800.00, timestamp: '2026-04-13T22:00:00Z', aiReason: 'Consolidation phase, awaiting catalyst', riskScore: 45 },
  { id: '5', pair: 'ETH/USDC', type: 'buy', confidence: 78, price: 3180.40, timestamp: '2026-04-13T16:00:00Z', aiReason: 'Support level bounce + positive funding rate', riskScore: 38 },
];

export const aiInsights: AIInsight[] = [
  { id: '1', type: 'trade', title: 'BTC Accumulation Zone', description: 'AI detected optimal entry point for BTC. Historical pattern match: 89%. Suggested DCA over next 48h.', confidence: 89, timestamp: '2026-04-14T10:15:00Z', action: 'Execute DCA' },
  { id: '2', type: 'route', title: 'Payment Route Optimization', description: 'Crypto routing saves 2.3% on next vendor payment vs card. Gas fees currently low.', confidence: 94, timestamp: '2026-04-14T09:45:00Z', action: 'Switch to crypto' },
  { id: '3', type: 'risk', title: 'Portfolio Risk Alert', description: 'ETH allocation exceeds recommended 25% threshold. Consider rebalancing to reduce exposure.', confidence: 76, timestamp: '2026-04-14T08:30:00Z', action: 'Rebalance' },
  { id: '4', type: 'alert', title: 'Unusual Activity Detected', description: 'Multiple login attempts from new IP range. 2FA verification recommended.', confidence: 95, timestamp: '2026-04-14T07:00:00Z', action: 'Review security' },
  { id: '5', type: 'trade', title: 'SOL Momentum Signal', description: 'Strong bullish momentum on SOL. Volume 3x average. AI recommends scaling in.', confidence: 82, timestamp: '2026-04-13T20:00:00Z', action: 'Open position' },
  { id: '6', type: 'route', title: 'Fee Optimization Available', description: 'Batch 3 pending payments to save ~$12 in transaction fees.', confidence: 88, timestamp: '2026-04-13T15:00:00Z', action: 'Batch payments' },
];

export const systemLogs: LogEntry[] = [
  { id: '1', level: 'success', category: 'Trade', message: 'Auto-trade executed: BUY 0.5 BTC @ $65,120', timestamp: '2026-04-14T10:30:00Z', details: 'Signal confidence: 87%, Risk: Low' },
  { id: '2', level: 'info', category: 'Payment', message: 'Payment routed via card: $149.99 to SaaS vendor', timestamp: '2026-04-14T09:15:00Z' },
  { id: '3', level: 'warning', category: 'Security', message: 'New device login detected from Chrome/Windows', timestamp: '2026-04-14T08:00:00Z', details: 'IP: 192.168.x.x, Location: San Francisco' },
  { id: '4', level: 'success', category: 'Wallet', message: 'Deposit confirmed: 0.25 BTC received', timestamp: '2026-04-14T07:30:00Z', details: 'Tx: 0xabc...def, 6 confirmations' },
  { id: '5', level: 'error', category: 'Payment', message: 'Card payment failed: insufficient funds', timestamp: '2026-04-13T16:00:00Z', details: 'Card ending 4242, Amount: $299.99' },
  { id: '6', level: 'info', category: 'AI Engine', message: 'Model retrained with latest market data', timestamp: '2026-04-13T12:00:00Z', details: 'Accuracy: 91.3%, Features: 47' },
  { id: '7', level: 'success', category: 'Trade', message: 'Position closed: SELL 2.5 ETH @ $3,250.80', timestamp: '2026-04-13T10:00:00Z', details: 'P&L: +$412.50 (+5.3%)' },
  { id: '8', level: 'info', category: 'System', message: 'Scheduled portfolio rebalance completed', timestamp: '2026-04-13T06:00:00Z' },
  { id: '9', level: 'warning', category: 'Risk', message: 'Portfolio volatility exceeds threshold (>15%)', timestamp: '2026-04-12T22:00:00Z', details: 'Current: 17.2%, Threshold: 15%' },
  { id: '10', level: 'success', category: 'Payment', message: 'Crypto payment sent: 500 USDC to vendor', timestamp: '2026-04-12T18:00:00Z', details: 'Gas: $0.42, Route: Optimized' },
];

export const balanceHistory = [
  { date: 'Mar 15', value: 178000 },
  { date: 'Mar 18', value: 182500 },
  { date: 'Mar 21', value: 179200 },
  { date: 'Mar 24', value: 185000 },
  { date: 'Mar 27', value: 188400 },
  { date: 'Mar 30', value: 186100 },
  { date: 'Apr 02', value: 190500 },
  { date: 'Apr 05', value: 189200 },
  { date: 'Apr 08', value: 193800 },
  { date: 'Apr 11', value: 195200 },
  { date: 'Apr 14', value: 196598 },
];

export const tradingHistory = [
  { date: 'Mar 15', pnl: 1200 },
  { date: 'Mar 18', pnl: -450 },
  { date: 'Mar 21', pnl: 890 },
  { date: 'Mar 24', pnl: 2100 },
  { date: 'Mar 27', pnl: -200 },
  { date: 'Mar 30', pnl: 1500 },
  { date: 'Apr 02', pnl: 780 },
  { date: 'Apr 05', pnl: -310 },
  { date: 'Apr 08', pnl: 1800 },
  { date: 'Apr 11', pnl: 950 },
  { date: 'Apr 14', pnl: 1340 },
];
