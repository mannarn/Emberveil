import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { ed25519 } from '@noble/curves/ed25519';
import { randomBytes, createHmac } from 'crypto';  // ← moved here from mid-file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

// ── Config ─────────────────────────────────────────────────────────────────────

const CONTRACT_ADDRESS  = process.env.CONTRACT_ADDRESS;
const RPC_URL           = process.env.RPC_URL           || "https://rpc-amoy.polygon.technology";
const RELAY_PRIVATE_KEY = process.env.RELAY_PRIVATE_KEY;
const JWT_SECRET        = process.env.JWT_SECRET || "103f4efb09dc0633d51bbee519e3bd41a1a11532ba6f1363eb7e1a89f07139db80e688ddc6d78cc401876ddf828fe1bfff3aca1ea10ba3f4f58e762aa966e988";
const PORT              = process.env.PORT || 8080;
const NONCE_TTL_MS      = 5 * 60 * 1000; // 5 minutes

if (!RELAY_PRIVATE_KEY) throw new Error('RELAY_PRIVATE_KEY required in .env');
if (!JWT_SECRET)        throw new Error('JWT_SECRET required in .env');

// ── ABI (inline — no filesystem dependency on Railway) ─────────────────────────
// Paste only the functions your relay actually calls.

const ABI = [
  "function isUsernameAvailable(string calldata username) external view returns (bool)",
  "function registeredUsernames(string calldata username) external view returns (bool)",
  "function isUserActive(string calldata username) external view returns (bool)",
  "function registerUser(string calldata username, string calldata didDocument, string calldata ed25519PublicKey, bytes32 passwordDoubleHash) external",
  "function getEd25519PublicKey(string calldata username) external view returns (string)",
  "function getUserProfile(string calldata username) external view returns (tuple(string didEmberveilDocument, string metadataCID, bool isActive, uint256 registrationTime))"
];

// ── Blockchain init ────────────────────────────────────────────────────────────

let provider, signer, contract;

async function initializeBlockchain() {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  signer   = new ethers.Wallet(RELAY_PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  console.log(`⛓  Contract: ${CONTRACT_ADDRESS}`);
  console.log(`👛 Relay wallet: ${signer.address}`);
}

// ── Nonce store (in-memory — swap for Redis in production) ─────────────────────

const nonceStore = new Map();

function generateNonce() {
  return randomBytes(32).toString('hex');
}

function clearExpiredNonces() {
  const now = Date.now();
  for (const [key, val] of nonceStore) {
    if (val.expiresAt < now) nonceStore.delete(key);
  }
}
setInterval(clearExpiredNonces, 60_000);

// ── JWT helpers (HS256 — no library needed) ────────────────────────────────────

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function issueJWT(payload) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const sig    = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyJWT(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expected = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Auth middleware ────────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing token' });
  const payload = verifyJWT(auth.slice(7));
  if (!payload)
    return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = payload;
  next();
}

// ── Routes ─────────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status:      'ok',
    relayWallet: signer?.address,
    contract:    CONTRACT_ADDRESS,
    network:     'Polygon Amoy',
    ready:       !!contract
  });
});

app.get('/api/wallet-info', async (req, res) => {
  try {
    if (!provider || !signer)
      return res.status(503).json({ error: 'Blockchain not ready.' });
    const balance = await provider.getBalance(signer.address);
    res.json({ address: signer.address, balance: ethers.formatEther(balance) });
  } catch (err) {
    res.status(500).json({ error: 'Wallet info failed.' });
  }
});

app.post('/api/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string' || username.length < 2 || username.length > 32)
      return res.status(400).json({ success: false, error: 'Username must be 2-32 characters.' });
    if (!/^[a-z0-9_-]+$/i.test(username))
      return res.status(400).json({ success: false, error: 'Invalid characters in username.' });
    if (!contract)
      return res.status(503).json({ success: false, error: 'Contract not initialized.' });

    const clean     = username.toLowerCase();
    const available = await contract.isUsernameAvailable(clean);
    res.json({ success: true, available, username: clean });
  } catch (err) {
    console.error('check-username:', err.message);
    res.status(500).json({ success: false, error: 'Failed to check username.' });
  }
});

app.post('/api/register-user', async (req, res) => {
  try {
    const { username, didDocument, ed25519PublicKey, passwordDoubleHash } = req.body;

    if (!username || !didDocument || !ed25519PublicKey || !passwordDoubleHash)
      return res.status(400).json({ error: 'Missing required fields.' });

    if (username.length < 2 || username.length > 32)
      return res.status(400).json({ error: 'Username must be 2-32 characters.' });
    if (!/^[a-z0-9_-]+$/i.test(username))
      return res.status(400).json({ error: 'Invalid username format.' });
    if (ed25519PublicKey.length !== 64)
      return res.status(400).json({ error: 'ed25519PublicKey must be 64 hex chars.' });
    if (!/^[0-9a-fA-F]+$/.test(ed25519PublicKey))
      return res.status(400).json({ error: 'ed25519PublicKey must be hex.' });
    if (passwordDoubleHash.length !== 66 || !passwordDoubleHash.startsWith('0x'))
      return res.status(400).json({ error: 'passwordDoubleHash must be 0x + 64 hex chars.' });

    if (!contract)
      return res.status(503).json({ error: 'Contract not initialized.' });

    const clean     = username.toLowerCase();
    const available = await contract.isUsernameAvailable(clean);
    if (!available)
      return res.status(409).json({ error: 'Username already taken.' });

    console.log('⛽ Estimating gas...');
    const gas      = await contract.registerUser.estimateGas(clean, didDocument, ed25519PublicKey, passwordDoubleHash);
    const gasLimit = (BigInt(gas) * BigInt(120)) / BigInt(100);
    const feeData  = await provider.getFeeData();
    const totalCost = gasLimit * feeData.gasPrice;

    const balance = await provider.getBalance(signer.address);
    if (balance < totalCost)
      return res.status(503).json({
        error:     'Relay wallet has insufficient funds.',
        needed:    ethers.formatEther(totalCost),
        available: ethers.formatEther(balance)
      });

    const tx      = await contract.registerUser(clean, didDocument, ed25519PublicKey, passwordDoubleHash, { gasLimit });
    const receipt = await tx.wait();

    console.log(`✓ Registered ${clean} → tx ${receipt.hash}`);
    res.status(201).json({
      success:     true,
      username:    clean,
      txHash:      receipt.hash,
      blockNumber: receipt.blockNumber
    });
  } catch (err) {
    console.error('register-user:', err.message);
    res.status(500).json({
      error: err.message.includes('insufficient') ? 'Relay wallet has insufficient funds.' : 'Registration failed.'
    });
  }
});

// ── Challenge-Response Sign-In ─────────────────────────────────────────────────

app.post('/api/auth/request-nonce', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string')
      return res.status(400).json({ error: 'username required' });

    const clean = username.toLowerCase();

    if (!contract)
      return res.status(503).json({ error: 'Contract not initialized.' });

    const exists = await contract.registeredUsernames(clean);
    if (!exists)
      return res.status(404).json({ error: 'User not found.' });

    const active = await contract.isUserActive(clean);
    if (!active)
      return res.status(403).json({ error: 'Account is deactivated.' });

    const nonce     = generateNonce();
    const expiresAt = Date.now() + NONCE_TTL_MS;
    nonceStore.set(clean, { nonce, expiresAt });

    console.log(`🔑 Nonce issued for ${clean}`);
    res.json({ success: true, nonce });
  } catch (err) {
    console.error('request-nonce:', err.message);
    res.status(500).json({ error: 'Failed to generate nonce.' });
  }
});

app.post('/api/auth/verify-signature', async (req, res) => {
  try {
    const { username, signature } = req.body;

    if (!username || !signature)
      return res.status(400).json({ error: 'username and signature required' });
    if (typeof signature !== 'string' || signature.length !== 128)
      return res.status(400).json({ error: 'signature must be 128 hex chars (64 bytes)' });

    const clean = username.toLowerCase();

    const record = nonceStore.get(clean);
    if (!record)
      return res.status(400).json({ error: 'No nonce found. Request a new one.' });
    if (Date.now() > record.expiresAt) {
      nonceStore.delete(clean);
      return res.status(400).json({ error: 'Nonce expired. Request a new one.' });
    }

    if (!contract)
      return res.status(503).json({ error: 'Contract not initialized.' });

    const pubKeyHex = await contract.getEd25519PublicKey(clean);
    if (!pubKeyHex)
      return res.status(404).json({ error: 'Public key not found on chain.' });

    const pubKeyBytes  = Uint8Array.from(Buffer.from(pubKeyHex, 'hex'));
    const sigBytes     = Uint8Array.from(Buffer.from(signature, 'hex'));
    const messageBytes = new TextEncoder().encode(record.nonce);

    let valid = false;
    try {
      valid = ed25519.verify(sigBytes, messageBytes, pubKeyBytes);
    } catch {
      valid = false;
    }

    // Consume nonce regardless — prevents replay attacks
    nonceStore.delete(clean);

    if (!valid) {
      console.log(`✗ Sig verification failed for ${clean}`);
      return res.status(401).json({ success: false, error: 'Invalid signature. Wrong password.' });
    }

    const token = issueJWT({
      username: clean,
      exp: Math.floor(Date.now() / 1000) + 86400  // 24 hours
    });

    console.log(`✓ Signed in: ${clean}`);
    res.json({ success: true, token, username: clean });
  } catch (err) {
    console.error('verify-signature:', err.message);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

app.get('/api/profile/:username', requireAuth, async (req, res) => {
  try {
    const clean = req.params.username.toLowerCase();
    if (req.user.username !== clean)
      return res.status(403).json({ error: 'Forbidden' });

    const profile = await contract.getUserProfile(clean);
    res.json({
      success:     true,
      username:    clean,
      did:         profile.didEmberveilDocument,
      metadataCID: profile.metadataCID,
      active:      profile.isActive,
      registered:  Number(profile.registrationTime)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ── Error handler ──────────────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ──────────────────────────────────────────────────────────────────────

async function startServer() {
  try {
    await initializeBlockchain();
    app.listen(PORT, () => console.log(`\n✓ Emberveil Relay running on port ${PORT}\n`));
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
}

startServer();
export default app;
