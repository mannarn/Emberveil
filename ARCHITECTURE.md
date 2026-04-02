# Emberveil System Architecture

## Overview

Emberveil is a **blockchain-backed self-sovereign identity system** with three layers:
1. **Client Layer**: Local key derivation and signing
2. **Relay Layer**: Stateless authentication verification and JWT issuance
3. **Blockchain Layer**: Immutable identity records and public key registry

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  Password UI     │    │  Security Q&A UI │    │ Key Derivation   │  │
│  │                  │    │                  │    │ (PBKDF2)         │  │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘  │
│           │                       │                        │             │
│           └───────────────────────┼────────────────────────┘             │
│                                   ▼                                      │
│                  ┌───────────────────────────────┐                      │
│                  │   Local Key Storage (IndexedDB)│                      │
│                  ├───────────────────────────────┤                      │
│                  │ • EVM Wallet Seed             │                      │
│                  │ • Ed25519 Private Key         │                      │
│                  │ • Salt & Security Answers     │                      │
│                  └───────────────────────────────┘                      │
│                                   │                                      │
│                  ┌────────────────▼─────────────┐                       │
│                  │  Ed25519 Signature Generation │                      │
│                  │  sign(nonce) → Signature      │                      │
│                  └────────────────┬─────────────┘                       │
│                                   │                                      │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │ HTTP/HTTPS
                    ┌───────────────▼────────────────┐
                    │  RELAY SERVER (Render.com)     │
                    ├────────────────────────────────┤
                    │ ┌─────────────────────────────┐│
                    │ │ POST /login                 ││
                    │ │ → Returns nonce (5min TTL)  ││
                    │ └─────────────────────────────┘│
                    │                                │
                    │ ┌─────────────────────────────┐│
                    │ │ POST /verify-signature      ││
                    │ │ • Fetch public key from     ││
                    │ │   UserRegistry contract     ││
                    │ │ • Verify Ed25519 signature  ││
                    │ │ • Issue JWT token           ││
                    │ └─────────────────────────────┘│
                    │                                │
                    └────────────┬───────────────────┘
                                 │ JSON RPC
                    ┌────────────▼──────────────────┐
                    │  BLOCKCHAIN (Polygon Amoy)    │
                    ├────────────────────────────────┤
                    │  UserRegistry Smart Contract   │
                    │  ┌──────────────────────────┐  │
                    │  │ mapping[username]        │  │
                    │  │  ├─ didDocument        │  │
                    │  │  ├─ ed25519PublicKey   │  │
                    │  │  ├─ metadataCID        │  │
                    │  │  ├─ passwordDoubleHash │  │
                    │  │  └─ registrationTime   │  │
                    │  └──────────────────────────┘  │
                    │ address: 0x614A4...322A       │
                    │ chain: Polygon Amoy (80002)   │
                    └───────────────────────────────┘
```

---

## Data Flow: Authentication Sequence

### 1. **User Registration**

```
Client                          Relay                   Blockchain
  │                               │                         │
  ├─ Derive keys from             │                         │
  │  password + security Q&A       │                         │
  │  using PBKDF2                  │                         │
  │                                │                         │
  ├──────────────────────────────────────────────────────────╮ POST /register
  │ username                       │                         │
  │ didDocument                    │                         │
  │ ed25519PublicKey (hex)         │                         │
  │ passwordDoubleHash             │                         │
  │ metadataCID                    │                         │
  │                                │                         │
  │                                ├──────────────────────────── register()
  │                                │ (Write UserProfile)        │
  │                                │                            ├──────────
  │                                │ (Emit UserRegistered event)│
  │                                │◄───────────────────────────┤
  │◄──────────────────────────────┤ (tx hash + success)        │
  │ userRegistry updated           │                         │
  │ Ready to authenticate          │                         │
```

### 2. **User Authentication (Login)**

```
Client                          Relay                   Blockchain
  │                               │                         │
  ├──────────────────────────────────────────────────────╮ POST /login
  │ { username: "alice" }         │                         │
  │                                │                         │
  │                                ├─ Generate nonce         │
  │                                ├─ Store in Map:          │
  │                                │  username → {           │
  │                                │    nonce: "random",     │
  │                                │    expiresAt: now+5min  │
  │                                │  }                      │
  │                                │                         │
  │◄───────────────────────────────┤  (nonce + TTL)          │
  │                                │                         │
  ├─ Sign nonce with locally      │                         │
  │  derived Ed25519 private key   │                         │
  │  signature = sign(nonce)       │                         │
  │                                │                         │
  ├──────────────────────────────────────────────────────╮ POST /verify-signature
  │ {                             │                         │
  │   username,                   │                         │
  │   signature,                  │                         │
  │   nonce                       │                         │
  │ }                             │                         │
  │                                │                         │
  │                                ├─ Check nonce TTL       │
  │                                ├─ Fetch UserRegistry    │
  │                                │  contract (readonly)    │
  │                                │                         │
  │                                ├──────────────────────────── 
  │                                │  userRegistry[username] │
  │                                │◄─ {                     │
  │                                │    didDocument,         │
  │                                │    ed25519PublicKey,    │
  │                                │    ...                  │
  │                                │  }                      │
  │                                │                         │
  │                                ├─ Verify Ed25519 sig    │
  │                                │  (publicKey matches)    │
  │                                │                         │
  │                                ├─ Issue JWT token       │
  │                                │ (sub: username,         │
  │                                │  exp: now + 1h)         │
  │                                │                         │
  │◄───────────────────────────────┤  (JWT + expiry)         │
  │ Store JWT in localStorage      │                         │
  │ Authenticated session ready    │                         │
```

---

## Component Details

### A. Client-Side Key Derivation

**Location**: `FrontEnd/` (authenticationUI.html)

```javascript
// Pseudo-code: Key derivation flow
const derivedKeysFromPassword = (password, username, securityAnswers) => {
  // 1. Create combined seed
  const seed = `${password}:${username}:${securityAnswers.join(':')}`;
  
  // 2. PBKDF2 key stretching
  const derivedBytes = PBKDF2(
    seed,
    salt = username,  // Deterministic
    iterations = 100000,
    outputLength = 64
  );
  
  // 3. Split into two keys
  const evmPrivateKey = derivedBytes.slice(0, 32);     // 256-bit
  const ed25519Seed = derivedBytes.slice(32, 64);      // 256-bit
  
  // 4. Derive public keys (non-exportable)
  const evmWallet = ethers.Wallet(evmPrivateKey);
  const ed25519PublicKey = Ed25519.publicKey(ed25519Seed);
  
  return {
    evmAddress: evmWallet.address,
    ed25519PublicKey: ed25519PublicKey.toHex(),
    // Private keys NEVER leave the client
  };
};
```

**Security Properties:**
- ✅ Deterministic: Same password → same keys (recovery)
- ✅ Non-exportable: Private keys never sent to server
- ✅ Salted: Salt = username prevents rainbow tables
- ✅ Slowness: 100k PBKDF2 iterations resist brute force

---

### B. Relay Server Architecture

**Location**: `emberveil-relay/`

**Stack**: Express.js + ethers.js on Render.com

**Endpoints:**

#### `POST /register`
- Input validation (username format, key format)
- Store UserProfile on blockchain
- Event emission (UserRegistered)

#### `POST /login`
- Generate cryptographically secure nonce
- 5-minute TTL (prevents replay attacks)
- In-memory store (or Redis for distributed relays)

#### `POST /verify-signature`
- Validate nonce is fresh and unused
- Fetch public key from UserRegistry
- Ed25519 signature verification
- JWT token generation (`sub: username, exp: now + 1h`)

**Key Design Decisions:**
- **Stateless signing**: Nonces are short-lived, allows horizontal scaling
- **Read-only blockchain call**: No transaction overhead for verification
- **JWT expiry**: 1-hour tokens balance security and UX
- **Never stores passwords**: Only password hash (for recovery fallback)

---

### C. Smart Contract: UserRegistry

**Location**: `contracts/UserRegistry.sol`

```solidity
struct UserProfile {
    string  didEmberveilDocument;  // DID document (JSON or CID)
    string  metadataCID;           // IPFS CID
    string  ed25519PublicKey;      // Hex: 64 chars
    string  passwordDoubleHash;    // keccak256(keccak256(PBKDF2))
    uint256 registrationTime;
    bool    isActive;
}

mapping(string => UserProfile) private userRegistry;
mapping(string => bool) public registeredUsernames;
```

**Key Methods:**

```solidity
function register(
    string memory username,
    string memory didEmberveilDocument,
    string memory metadataCID,
    string memory ed25519PublicKey,
    string memory passwordDoubleHash
)
```
- Validates username uniqueness
- Stores profile in mapping
- Emits `UserRegistered` event

```solidity
function getPublicKey(string memory username) 
  external view returns (string memory)
```
- Called by relay during verification
- Returns ed25519 public key for signature verification
- Zero gas cost (view function)

**Security Properties:**
- ✅ Immutable public keys: Once set, cannot be changed without new registration
- ✅ Blockchain-backed: Uses Polygon finality
- ✅ Event log: All registrations are auditable

---

## Data Models

### UserProfile (On-Chain)

```json
{
  "didEmberveilDocument": "did:emberveil:polygon:alice#key-1",
  "metadataCID": "QmXxxxxxxxxxxx...",
  "ed25519PublicKey": "ab12cd34ef56...",
  "passwordDoubleHash": "0x3f4a5b6c...",
  "registrationTime": 1704067200,
  "isActive": true
}
```

### JWT Token (Issued by Relay)

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "alice",
    "iat": 1704067200,
    "exp": 1704070800,
    "role": "user"
  },
  "signature": "HMACSHA256(payload, JWT_SECRET)"
}
```

---

## Deployment Architecture

### Current Production Setup

```
┌─────────────────┐
│  GitHub Repo    │ (Source control)
│  Emberveil      │
└────────┬────────┘
         │
         ├──────────────────────────────────┬─────────────────────────┐
         │                                  │                         │
    ┌────▼──────┐                  ┌───────▼────────┐        ┌───────▼────────┐
    │ Contracts │                  │  Relay Server  │        │  Frontend      │
    │ Deployment│                  │ (Render.com)   │        │  (GitHub Pages)│
    └────┬──────┘                  │  Docker        │        │  (S3 + CDN)    │
         │                         │  Auto-deploy   │        │  (Netlify)     │
         │                         └────────┬───────┘        └────────────────┘
    ┌────▼──────────┐                      │
    │ Polygon Amoy  │           ┌──────────▼──────────┐
    │ Testnet       │           │  Express API        │
    │ ChainID: 80002│           │  :3001 (internal)   │
    │ RPC: amoy.    │           │  Render public URL  │
    │ polygon...    │           │                     │
    └───────────────┘           └─────────────────────┘
```

### Environment Configuration

**Production (.env in Render)**
```bash
RELAY_PRIVATE_KEY=0x...    # Relay operator's wallet key
JWT_SECRET=super-secret... # JWT signing key
PORT=3001
NODE_ENV=production
```

**Local Testing (.env in root)**
```bash
PRIVATE_KEY=0x...         # For contract deployment
RELAY_PRIVATE_KEY=0x...   # For local relay testing
JWT_SECRET=test-secret
PORT=3001
```

---

## Security Considerations

### 1. **Private Key Management**

| Key | Storage | Usage | Risk |
|-----|---------|-------|------|
| User E25519 Private | Client (IndexedDB) | Signing nonces | ✅ Never transmitted |
| User EVM Private | Client (IndexedDB) | Future: Direct txs | ✅ Never transmitted |
| Relay Private | Render env var | Wallet operations | ⚠️ Infrastructure trust |
| JWT Secret | Render env var | Token signing | ⚠️ Infrastructure trust |

### 2. **Nonce Security**

```javascript
// Prevent replay attacks:
// 1. Unique per request
const nonce = randomBytes(32).toString('hex');

// 2. TTL = 5 minutes (tight window)
const expiresAt = Date.now() + 5 * 60 * 1000;

// 3. Single-use (deleted after verification)
nonceStore.delete(username);

// 4. Cryptographically secure (not predictable)
```

### 3. **Signature Verification**

```javascript
// Prevents tampering with nonce/username
const isValid = ed25519.verify(
  userPublicKey,
  signatureFromClient,
  nonceBytes
);
```

---

## Scalability Roadmap

### Current (In-Memory)
- Single relay instance
- Nonce store: Map<username, {nonce, expiresAt}>
- Connection limit: ~10k concurrent users

### Phase 2 (Redis Cluster)
- Replace Map with Redis
- Enables multi-relay horizontal scaling
- TTL-based auto-expiry (Redis EXPIRE)

### Phase 3 (Distributed Relays)
- Deploy relays in multiple regions
- Global CDN for frontend
- Database for audit logs + metrics

---

## Testing Strategy

### Unit Tests (Contract)
```bash
npm test
```
- Register user → verify storage
- Verify signature → success/failure cases
- Access control → owner-only functions

### Integration Tests
- Local relay + contract interaction
- Full auth flow (register → login → verify)
- Error handling (expired nonce, invalid signature)

### Security Tests
- Signature forgery attempts
- Nonce replay attacks
- Private key exposure scenarios

---

## Future Extensions

### 1. **OAuth2 Provider**
Allow any app to "Sign in with Emberveil"

```
App → Emberveil OAuth → User approval → JWT to App
```

### 2. **Decentralized Relay Network**
Users choose which relay to trust, not locked to single operator

### 3. **Hardware Wallet Integration**
Sign with hardware wallet instead of password-derived keys

### 4. **Cross-Chain Support**
Replicate profiles to Ethereum, Solana, etc.

---

## References

- [Polygon Documentation](https://polygon.technology/)
- [Ed25519 Cryptography](https://ed25519.cr.yp.to/)
- [PBKDF2 Key Derivation](https://tools.ietf.org/html/rfc8018)
- [DID Specification](https://www.w3.org/TR/did-core/)
- [JWT Standards](https://tools.ietf.org/html/rfc7519)
