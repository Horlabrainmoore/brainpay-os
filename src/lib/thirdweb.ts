import { createThirdwebClient } from "thirdweb";
import { inAppWallet, createWallet } from "thirdweb/wallets";

const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID?.trim();

if (!clientId) {
  throw new Error("VITE_THIRDWEB_CLIENT_ID is not configured.");
}

export const thirdwebClient = createThirdwebClient({ clientId });

export const thirdwebWallets = [
  inAppWallet({
    auth: {
      options: ["google", "discord", "telegram", "farcaster", "email", "x", "passkey", "phone"],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];
