// On-chain wallet + NFT loading for the arcade. Replaces the old mock wallet:
// playable serpents now come from the REAL Snakiox ERC-721s a wallet holds on
// Sepolia. We read each token's on-chain metadata (tokenURI → base64 JSON) and
// shape it into the exact token object the renderer/UI already expect, so the
// in-game snake is byte-for-byte the minted NFT.
import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  getAddress
} from "ethers";

export const CONTRACT_ADDRESS = import.meta.env.VITE_MINT_CONTRACT_ADDRESS || "";
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 11155111);
export const RPC_URL = import.meta.env.VITE_RPC_URL || "";
export const DEPLOY_BLOCK = Number(import.meta.env.VITE_DEPLOY_BLOCK || 0);
export const OPENSEA_BASE_URL =
  import.meta.env.VITE_OPENSEA_BASE_URL || "https://testnets.opensea.io/assets/sepolia";

const CHAIN_HEX = `0x${CHAIN_ID.toString(16)}`;
const EXPLORER = "https://sepolia.etherscan.io";

// Only the reads we need to enumerate + render a wallet's collection.
const ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// ─── EIP-6963 wallet discovery ─────────────────────────────────────────────────
// Modern multi-wallet discovery: every installed wallet announces itself, so we
// can list them by name/icon instead of guessing at window.ethereum. We still
// fall back to a plain injected provider when nothing announces.
const discovered = new Map(); // rdns -> { info, provider }
let activeProvider = null;    // the EIP-1193 provider the user picked

if (typeof window !== "undefined") {
  window.addEventListener("eip6963:announceProvider", (event) => {
    const { info, provider } = event.detail || {};
    if (info?.rdns && provider) discovered.set(info.rdns, { info, provider });
  });
  // Ask any wallets that loaded before us to (re)announce.
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function hasInjectedWallet() {
  return typeof window !== "undefined" && (discovered.size > 0 || !!window.ethereum);
}

// Snapshot of connectable wallets for the connect screen.
export function listWallets() {
  // Re-poke discovery in case a wallet injected late.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }
  const wallets = [...discovered.values()].map(({ info, provider }) => ({
    id: info.rdns,
    name: info.name,
    icon: info.icon,
    provider
  }));
  if (wallets.length === 0 && typeof window !== "undefined" && window.ethereum) {
    wallets.push({ id: "injected", name: "Browser Wallet", icon: null, provider: window.ethereum });
  }
  return wallets;
}

function injected() {
  if (activeProvider) return activeProvider;
  if (typeof window !== "undefined" && window.ethereum) return window.ethereum;
  return null;
}

// ─── connect / network ─────────────────────────────────────────────────────────

export async function connectWallet(walletOrProvider) {
  const provider =
    walletOrProvider?.provider || walletOrProvider || injected();
  if (!provider) {
    throw new Error("No wallet found. Install MetaMask (or another browser wallet) to play with your Snakiox.");
  }
  activeProvider = provider;

  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!accounts?.length) throw new Error("No account authorized.");

  await ensureSepolia(provider);

  return { address: getAddress(accounts[0]), provider };
}

// Silent reconnect on page load — returns the address if the wallet already
// authorized this site, without popping the wallet UI.
export async function getConnectedAccount() {
  const provider = injected();
  if (!provider) return null;
  try {
    const accounts = await provider.request({ method: "eth_accounts" });
    if (accounts?.length) {
      activeProvider = provider;
      return getAddress(accounts[0]);
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function ensureSepolia(provider = injected()) {
  if (!provider) return;
  try {
    const current = await provider.request({ method: "eth_chainId" });
    if (current?.toLowerCase() === CHAIN_HEX.toLowerCase()) return;
  } catch {
    /* fall through to switch */
  }
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_HEX }]
    });
  } catch (error) {
    // 4902 = chain not added yet → add it, then it's selected.
    if (error?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: CHAIN_HEX,
          chainName: "Sepolia",
          nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [RPC_URL || "https://rpc.sepolia.org"],
          blockExplorerUrls: [EXPLORER]
        }]
      });
    } else {
      throw error;
    }
  }
}

// Subscribe to wallet account/chain changes. Returns an unsubscribe fn.
export function watchWallet({ onAccountsChanged, onChainChanged } = {}) {
  const provider = injected();
  if (!provider?.on) return () => {};
  const accounts = (accs) => onAccountsChanged?.(accs?.length ? getAddress(accs[0]) : null);
  const chain = (cid) => onChainChanged?.(cid);
  provider.on("accountsChanged", accounts);
  provider.on("chainChanged", chain);
  return () => {
    provider.removeListener?.("accountsChanged", accounts);
    provider.removeListener?.("chainChanged", chain);
  };
}

// ─── NFT loading ────────────────────────────────────────────────────────────────

// A read provider for the (potentially large) Transfer-event scan. Prefer a
// dedicated RPC so we sidestep injected-wallet getLogs range limits.
function readProvider() {
  if (RPC_URL) return new JsonRpcProvider(RPC_URL, CHAIN_ID);
  const p = injected();
  if (p) return new BrowserProvider(p);
  throw new Error("No RPC available to read the chain.");
}

// Map on-chain metadata attributes (trait_type/value) → the demo's trait shape.
// The trait_types are identical to the demo's fields, so the live serpent
// matches the minted art exactly.
function traitsFromAttributes(attributes = []) {
  const attr = {};
  for (const a of attributes) attr[a.trait_type] = a.value;
  return {
    traits: {
      rarity:      attr["Rarity"]      ?? "Common",
      skinSeries:  attr["Skin Series"] ?? "Forged",
      skin:        attr["Skin"]        ?? "Cold Steel",
      formSeries:  attr["Form Series"] ?? "Serpent",
      form:        attr["Form"]        ?? "Pit Viper",
      mark:        attr["Mark"]        ?? "None",
      gaze:        attr["Gaze"]        ?? "Default",
      crown:       attr["Crown"]       ?? "None",
      sigil:       attr["Sigil"]       ?? "None",
      curse:       attr["Curse"]       ?? "None",
      bodyPattern: attr["Pattern"]     ?? "None"
    },
    len: Number(attr["Length"]) || 40,
    score: Number(attr["Score"]) || 0
  };
}

function buildToken(tokenId, name, image, attributes) {
  const idStr = tokenId.toString();
  const { traits, len, score } = traitsFromAttributes(attributes);
  return {
    tokenId: idStr,
    name: name || `Snakiox #${idStr.padStart(5, "0")}`,
    traits,
    len,
    image: image || "",
    score
  };
}

// If the configured RPC is an Alchemy endpoint, derive its NFT API base. The
// NFT API (getNFTsForOwner) works on the free tier and returns owned tokens +
// metadata in one call — unlike eth_getLogs, which the free tier caps at a tiny
// block range (so a Transfer-event scan can't enumerate a collection there).
function alchemyNftBase() {
  const m = RPC_URL.match(/^(https:\/\/[^/]+)\/v2\/(.+)$/);
  if (m && /alchemy\.com$/i.test(new URL(m[1]).hostname)) {
    return `${m[1]}/nft/v3/${m[2]}`;
  }
  return null;
}

async function loadViaAlchemy(base, owner) {
  const tokens = [];
  let pageKey;
  do {
    const url = new URL(`${base}/getNFTsForOwner`);
    url.searchParams.set("owner", owner);
    url.searchParams.append("contractAddresses[]", CONTRACT_ADDRESS);
    url.searchParams.set("withMetadata", "true");
    if (pageKey) url.searchParams.set("pageKey", pageKey);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`NFT API error (${res.status}).`);
    const data = await res.json();

    for (const n of data.ownedNfts || []) {
      const meta = n.raw?.metadata || n.metadata || {};
      tokens.push(
        buildToken(n.tokenId, n.name || meta.name, meta.image, meta.attributes)
      );
    }
    pageKey = data.pageKey;
  } while (pageKey);

  return tokens;
}

// Fallback for non-Alchemy RPCs (e.g. a public node that allows full-range
// getLogs): enumerate via Transfer-into events, then verify current ownership.
async function loadViaLogs(owner) {
  const provider = readProvider();
  const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
  const balance = Number(await contract.balanceOf(owner));
  if (balance === 0) return [];

  const filter = contract.filters.Transfer(null, owner);
  const latest = await provider.getBlockNumber();

  let logs = [];
  try {
    logs = await contract.queryFilter(filter, DEPLOY_BLOCK, latest);
  } catch {
    const CHUNK = 45000;
    for (let to = latest; to >= DEPLOY_BLOCK; to -= CHUNK + 1) {
      const from = Math.max(DEPLOY_BLOCK, to - CHUNK);
      try {
        logs.push(...(await contract.queryFilter(filter, from, to)));
      } catch {
        /* skip an unhappy window */
      }
      if (from === DEPLOY_BLOCK) break;
    }
  }

  const seen = new Set();
  const owned = [];
  for (const l of logs) {
    const id = l.args.tokenId;
    const key = id.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      if (getAddress(await contract.ownerOf(id)) === owner) owned.push(id);
    } catch {
      /* burned / moved on */
    }
    if (owned.length >= balance) break;
  }

  const tokens = await Promise.all(
    owned.map(async (id) => {
      try {
        const uri = await contract.tokenURI(id);
        const json = JSON.parse(window.atob(uri.replace("data:application/json;base64,", "")));
        return buildToken(id, json.name, json.image, json.attributes);
      } catch {
        return null;
      }
    })
  );
  return tokens.filter(Boolean);
}

// Load every Snakiox the wallet currently holds, newest tokenId first.
export async function loadWalletSnakes(address) {
  if (!CONTRACT_ADDRESS) throw new Error("Contract address is not configured.");
  const owner = getAddress(address);

  const base = alchemyNftBase();
  const tokens = base ? await loadViaAlchemy(base, owner) : await loadViaLogs(owner);

  return tokens.sort((a, b) => Number(b.tokenId) - Number(a.tokenId));
}

// ─── formatting helpers ──────────────────────────────────────────────────────

export function shortAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function explorerAddressUrl(addr) {
  return `${EXPLORER}/address/${addr}`;
}

export function openseaTokenUrl(tokenId) {
  return `${OPENSEA_BASE_URL}/${CONTRACT_ADDRESS}/${tokenId}`;
}
