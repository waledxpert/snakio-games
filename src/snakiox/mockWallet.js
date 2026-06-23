// Demo wallet contents. In production these would come from reading the wallet's
// Snakiox ERC-721s and their on-chain traits; here we mint a curated handful
// from the real generator so the playable snakes look authentic.
import { createToken } from "./generator";

const WALLET_SEEDS = [
  { tokenId: 417, seed: "demo-417", length: 40 },
  { tokenId: 1337, seed: "demo-1337", length: 52 },
  { tokenId: 2604, seed: "demo-2604", length: 38 },
  { tokenId: 3140, seed: "demo-3140", length: 46 },
  { tokenId: 5050, seed: "demo-5050", length: 44 },
  { tokenId: 6201, seed: "demo-6201", length: 50 }
];

const WALLET_ALIASES = {
  "0xPlayer": "0x7F3a…A2C9",
  "0xGuest": "0x00DE…B00B"
};

export const MOCK_WALLETS = [
  { id: "0xPlayer", label: WALLET_ALIASES["0xPlayer"], kind: "MetaMask", accent: "#f6851b" },
  { id: "0xGuest", label: WALLET_ALIASES["0xGuest"], kind: "WalletConnect", accent: "#3b99fc" }
];

// Each wallet "owns" the same demo set for now — demo mode. Token ids stay stable.
export function loadWalletSnakes(walletId) {
  const suffix = String(walletId).slice(-2);
  return WALLET_SEEDS.map(({ tokenId, seed, length }) =>
    createToken(`${seed}-${suffix}`, { tokenId, length })
  );
}

export const NULL_ADDRESS = "0x0000…0000";
