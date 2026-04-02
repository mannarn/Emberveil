# Getting Started with Emberveil

## What is Emberveil?

Emberveil is a **self-sovereign identity platform** that lets you:
- Own your digital identity (not controlled by any company)
- Authenticate to apps using cryptographic signatures (not passwords)
- Port your identity across any application

Think of it like owning a digital passport that works everywhere.

---

## 5-Minute Quickstart

### 1. Register an Account

```bash
# Create your identity
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "username": "alice",
  "didDocument": "did:emberveil:polygon:alice#key-1",
  "ed25519PublicKey": "ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdef",
  "passwordDoubleHash": "0x3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f"
}

# Response
{
  "success": true,
  "username": "alice",
  "txHash": "0x...",
  "blockNumber": 12345
}
```

### 2. Request a Login Nonce

```bash
POST http://localhost:8080/api/auth/request-nonce
Content-Type: application/json

{
  "username": "alice"
}

# Response
{
  "success": true,
  "nonce": "random-string-...",
  "expiresIn": 300
}
```

### 3. Sign the Nonce

Client-side, derive your private key and sign:

```javascript
// Browser/client code (never send private key to server!)
const { ed25519 } = await import('@noble/curves/ed25519');

// Derive private key from password + security questions (PBKDF2)
const privateKey = derivePrivateKeyFromPassword(password, securityAnswers);

// Sign the nonce
const signature = ed25519.sign(messageBytes, privateKey);
```

### 4. Verify Signature & Get JWT

```bash
POST http://localhost:8080/api/auth/verify-signature
Content-Type: application/json

{
  "username": "alice",
  "signature": "ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdefab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdef"
}

# Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### 5. Use JWT for Authenticated Requests

```bash
GET http://localhost:8080/api/user/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Response
{
  "success": true,
  "username": "alice",
  "didDocument": "did:emberveil:polygon:alice#key-1",
  "registeredAt": "2026-03-31T12:00:00Z"
}
```

---

## Installation

### For Smart Contract Development

```bash
# Clone repo
git clone https://github.com/yourusername/Emberveil.git
cd Emberveil

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your:
# - PRIVATE_KEY (for contract deployment)
# - RELAY_PRIVATE_KEY (for relay server)
# - JWT_SECRET (for JWT signing)
```

### For Relay Server

```bash
cd emberveil-relay

# Install dependencies
npm install

# Create .env
cat > .env << EOF
CONTRACT_ADDRESS=0x614A4148d1BeD71b3634Fa18b7f0D4CFD491322A
RPC_URL=https://rpc-amoy.polygon.technology
RELAY_PRIVATE_KEY=0x...
JWT_SECRET=your-super-secret-key
PORT=3001
EOF

# Start server
npm start

# Development mode with hot reload
npm run dev
```

### For Frontend

```bash
cd FrontEnd

# Serve with live reload
python -m http.server 8000

# Or use a bundler
npm install -D vite
npx vite
```

---

## Core Concepts

### 1. **Self-Sovereign Identity**
Users own their identity through a password-derived cryptographic key pair:
- **EVM Wallet**: For blockchain transactions
- **Ed25519 Keypair**: For authentication signatures

### 2. **Challenge-Response Authentication**
No passwords ever sent to server:

```
Client                              Relay
  │                                  │
  ├─ Request nonce ──────────────────>
  │                                  
  │ <─ Random nonce ─────────────────┤
  │
  ├─ Sign nonce locally (offline)
  │  (private key NEVER leaves client)
  │
  ├─ Send signature ───────────────────>
  │                                  
  │                    ┌─ Verify signature
  │                    │  against public key on chain
  │                    └─ Issue JWT
  │
  │ <─ JWT token ──────────────────────┤
  │
  ├─ Use JWT for authenticated requests ────>
```

### 3. **Blockchain-Backed Public Keys**
Your public key is stored on-chain (Polygon Amoy):
```solidity
struct UserProfile {
    string ed25519PublicKey;      // Used for signature verification
    string didEmberveilDocument;  // Your identity document
    uint256 registrationTime;
    bool isActive;
}
```

### 4. **DID (Decentralized Identity)**
Your identity is represented as a DID (Decentralized Identifier):
```
did:emberveil:polygon:alice#key-1
│    │        │       │      │
│    │        │       │      └─ Key fragment
│    │        │       └─ Username
│    │        └─ Network
│    └─ Method
└─ Scheme
```

---

## Development Workflow

### 1. Start Local Relay

```bash
# Terminal 1: Relay server
cd emberveil-relay
npm start
# Output: ✓ Emberveil Relay running on port 8080
```

### 2. Deploy Contract to Testnet

```bash
# Terminal 2: Deploy
npm run deploy

# Output:
# ⛓  Contract: 0x614A4148d1BeD71b3634Fa18b7f0D4CFD491322A
# 👛 Relay wallet: 0xabcd...
```

### 3. Run Tests

```bash
# Terminal 3: Tests
npm test

# Runs:
# - Contract unit tests
# - Integration tests
```

### 4. Test Authentication Flow

```bash
# Use PostMan, curl, or the test script:
npm run test:startup
```

---

## API Reference

### Base URL
- **Local**: `http://localhost:8080/api`
- **Production**: `https://emberveil-relay-prod.onrender.com/api`

### Endpoints

#### Health Check
```
GET /health
Response: { status, ready, timestamp }
```

#### Authentication
```
POST /auth/register       → Register new user
POST /auth/request-nonce  → Get nonce for login
POST /auth/verify-signature → Verify signature & login
```

#### User Profile
```
GET /user/me              → Get your profile (auth required)
GET /user/profile/:username → Get user profile (auth required)
GET /user/public/:username  → Check if user exists (public)
```

See [API Documentation](./api.md) for full details.

---

## Environment Variables

### Local Development

```bash
# .env (local testing)
PRIVATE_KEY=0x...                          # For contract deployment
RELAY_PRIVATE_KEY=0x...                    # Relay operator wallet
JWT_SECRET=your-super-secret-key
CONTRACT_ADDRESS=0x614A...                 # After deployment
RPC_URL=https://rpc-amoy.polygon.technology
PORT=8080
NODE_ENV=development
```

### Production (Render/Railway)

```bash
# Set in deployment platform:
RELAY_PRIVATE_KEY=0x...
JWT_SECRET=super-secret-key-min-32-chars
CONTRACT_ADDRESS=0x...
NODE_ENV=production
```

---

## Testing

### Run All Tests
```bash
npm test
```

### Specific Test Suite
```bash
npm test -- test/UserRegistry.test.js
```

### With Coverage
```bash
npm run coverage
```

### Gas Report
```bash
npm test -- --gas-reporter
```

---

## Common Issues

### ❌ "Contract not initialized"
**Fix**: Ensure relay server has started and CONTRACT_ADDRESS is set

### ❌ "Signature verification failed"
**Fix**: Check that:
- Nonce hasn't expired (5 minute TTL)
- Nonce matches between request and verification
- Private key derivation is correct

### ❌ "Insufficient funds"
**Fix**: Fund relay wallet with test MATIC:
```bash
# Get test MATIC from faucet
https://faucet.polygon.technology/

# Check balance
curl http://localhost:8080/api/wallet-info
```

### ❌ "User already exists"
**Fix**: Choose a different username or check availability:
```bash
curl -X POST http://localhost:8080/api/auth/request-nonce \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser"}'
```

---

## Next Steps

1. **[Read Architecture](./ARCHITECTURE.md)** — Understand system design
2. **[Review API Docs](./api.md)** — Full endpoint reference
3. **[Frontend Guide](./FRONTEND_MODERNIZATION.md)** — Build UI
4. **[Deploy to Production](./deployment.md)** — Launch to Polygon

---

## Resources

- **GitHub**: [Emberveil Repository](https://github.com/yourusername/Emberveil)
- **Docs**: [Full Documentation](../README.md)
- **Discord**: [Community](https://discord.gg/emberveil)
- **Twitter**: [@emberveil](https://twitter.com/emberveil)

---

**Questions?** Open an issue on GitHub or reach out on Discord.
