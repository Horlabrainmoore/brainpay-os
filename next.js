import { ethereum } from "thirdweb/chains";
import { ConnectButton } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { inAppWallet, createWallet } from "thirdweb/wallets";

const client = createThirdwebClient({
  clientId: "....",
});

const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
        "discord",
        "telegram",
        "email",
        "x",
        "passkey",
        "phone",
        "apple",
        "github",
        "farcaster",
        "twitch",
        "steam",
        "facebook",
        "line",
        "guest",
        "coinbase",
        "epic",
        "tiktok",
      ],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.zerion.wallet"),
  createWallet("com.trustwallet.app"),
  createWallet("com.bitcoin"),
  createWallet("com.binance.wallet"),
  createWallet("io.rabby"),
  createWallet("com.safepal"),
  createWallet("io.ironwallet"),
  createWallet("pro.tokenpocket"),
  createWallet("com.fireblocks"),
  createWallet("com.blockchain.login"),
  createWallet("com.bybit"),
];

function Example() {
  return (
    <ConnectButton
      accountAbstraction={{
        chain: ethereum, // replace with the chain you want
        sponsorGas: true,
      }}
      auth={{
        async doLogin(params) {
          // call your backend to verify the signed payload passed in params
        },
        async doLogout() {
          // call your backend to logout the user if needed
        },
        async getLoginPayload(params) {
          // call your backend and return the payload
        },
        async isLoggedIn() {
          // call your backend to check if the user is logged in
        },
      }}
      client={client}
      connectButton={{ label: "Connect" }}
      connectModal={{ size: "compact" }}
      wallets={wallets}
    />
  );
},