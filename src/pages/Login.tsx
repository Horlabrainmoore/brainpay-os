import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Shield } from 'lucide-react';
import { ConnectButton } from 'thirdweb/react';
import { thirdwebClient, thirdwebWallets } from '@/lib/thirdweb';

const Login = () => {
  const navigate = useNavigate();

  const auth = {
    getLoginPayload: async ({ address }: { address: string }) => {
      const response = await fetch('/api/auth/payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address }),
      });
      if (!response.ok) throw new Error('Unable to create a secure login challenge.');
      return response.json();
    },

    doLogin: async (params: unknown) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Wallet authentication failed.');
      navigate('/dashboard');
    },

    isLoggedIn: async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      });
      return response.ok;
    },

    doLogout: async () => {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/');
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-bg relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">MT5 Hedged Equity</h1>
          <p className="text-muted-foreground text-sm mt-1">Secure wallet authentication</p>
        </div>

        <div className="panel-gradient rounded-xl border border-border p-6 space-y-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border pb-4">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>Sign a challenge; your private keys never leave the wallet</span>
          </div>

          <ConnectButton
            client={thirdwebClient}
            connectModal={{ size: 'compact' }}
            wallets={thirdwebWallets}
            auth={auth}
          />

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            Connecting or signing does not authorize any transfer or MT5 trade.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
