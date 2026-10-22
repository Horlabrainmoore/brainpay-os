// Usage in a Next.js API route
import { settlePayment, facilitator } from "thirdweb/x402";
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";

const client = createThirdwebClient({
  secretKey: process.env.ba98f93b519eb8934a34e2a459da09e9,
});

const thirdwebFacilitator = facilitator({
  client,
  serverWalletAddress: "ba98f93b519eb8934a34e2a459da09e9",
  waitUntil: "simulated",
});

export async function POST(request: Request) {
  const paymentData =
    request.headers.get("PAYMENT-SIGNATURE") ||
    request.headers.get("X-PAYMENT");

  // verify and process the payment
  const result = await settlePayment({
    resourceUrl: "https://t.me/mql5algotradings/9455",
    method: "POST",
    paymentData,
    payTo: "0xC2446449720e2a725e492C568658fEe4CCd99a22",
    network: defineChain(1),
    price: {
      amount: "500000000000000000",
      asset: {
        address: "0xE0c3bb8527A375D961dA470ffECDE35ADb8b91A5",
      },
    },
    facilitator: thirdwebFacilitator,
  });

  if (result.status === 200) {
    // Payment verified and settled successfully
    return Response.json({ data: "premium content" });
  } else {
    // Payment required
    return Response.json(result.responseBody, {
      status: result.status,
      headers: result.responseHeaders,
    });
  }
}
