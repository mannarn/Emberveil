# Emberveil Relay API Reference

## Overview

The Emberveil Relay is an Express.js server that handles:
- User registration and profile management
- Challenge-response authentication (no passwords)
- JWT token issuance
- Public key verification

**Base URL**: `https://emberveil-relay.onrender.com/api`  
**Protocol**: HTTP/HTTPS with JSON  
**Authentication**: JWT Bearer tokens

---

## Error Handling

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created (resource) |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (invalid JWT) |
| 403 | Forbidden (access denied) |
| 404 | Not Found (resource doesn't exist) |
| 409 | Conflict (username taken) |
| 503 | Service Unavailable (blockchain not ready) |

---

## Endpoints

### Health & Status

#### GET /health
Check if relay is running and ready.

**Request**
```bash
GET /api/health
```

**Response (200)**
```json
{
  "success": true,
  "status": "ok",
  "ready": true,
  "relayWallet": "0xabcd...",
  "contractAddress": "0x614A...",
  "network": "Polygon Amoy",
  "timestamp": "2026-03-31T12:00:00Z"
}
```

---

#### GET /wallet-info
Get relay operator's wallet balance.

**Request**
```bash
GET /api/wallet-info
```

**Response (200)**
```json
{
  "success": true,
  "address": "0xabcd...",
  "balance": "1.5",
  "balanceWei": "1500000000000000000"
}
```

**Response (503)**
```json
{
  "success": false,
  "error": "Blockchain not ready"
}
```

---

#### GET /version
Get relay version and protocol info.

**Request**
```bash
GET /api/version
```

**Response (200)**
```json
{
  "success": true,
  "name": "emberveil-relay",
  "version": "2.0.0",
  "protocol": "Ed25519 Challenge-Response",
  "blockchain": "Polygon Amoy",
  "tokenScheme": "JWT HS256"
}
```

---

### Authentication

#### POST /auth/register
Register a new user with public key.

**Request**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "alice",
  "didDocument": "did:emberveil:polygon:alice#key-1",
  "ed25519PublicKey": "ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdef",
  "passwordDoubleHash": "0x3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f"
}
```

**Parameters**
| Field | Type | Description |
|-------|------|-------------|
| username | string | 2-32 chars, alphanumeric + `_-` |
| didDocument | string | DID document JSON or IPFS CID |
| ed25519PublicKey | string | 64 hex chars (32 bytes) |
| passwordDoubleHash | string | `0x` + 64 hex chars |

**Response (201)**
```json
{
  "success": true,
  "username": "alice",
  "txHash": "0x123abc...",
  "blockNumber": 12345,
  "message": "User registered successfully"
}
```

**Response (400)**
```json
{
  "success": false,
  "error": "Username must be 2-32 characters"
}
```

**Response (409)**
```json
{
  "success": false,
  "error": "Username already taken"
}
```

**Response (503)**
```json
{
  "success": false,
  "error": "Relay wallet has insufficient funds",
  "needed": "0.05",
  "available": "0.01"
}
```

---

#### POST /auth/request-nonce
Generate a login nonce for signature verification.

**Request**
```bash
POST /api/auth/request-nonce
Content-Type: application/json

{
  "username": "alice"
}
```

**Parameters**
| Field | Type | Description |
|-------|------|-------------|
| username | string | Username to log in |

**Response (200)**
```json
{
  "success": true,
  "nonce": "6f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b2c3d4e5f6a7b8c9d0e",
  "expiresIn": 300,
  "algorithm": "Ed25519"
}
```

**Response (404)**
```json
{
  "success": false,
  "error": "User not found"
}
```

**Response (403)**
```json
{
  "success": false,
  "error": "Account is deactivated"
}
```

---

#### POST /auth/verify-signature
Verify Ed25519 signature and issue JWT token.

**Request**
```bash
POST /api/auth/verify-signature
Content-Type: application/json

{
  "username": "alice",
  "signature": "ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdefab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdef"
}
```

**Parameters**
| Field | Type | Description |
|-------|------|-------------|
| username | string | Username to verify |
| signature | string | Ed25519 signature (128 hex chars = 64 bytes) |

**Response (200)**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFsaWNlIiwiaWF0IjoxNzE0NjUyMDAwLCJleHAiOjE3MTQ3Mzg0MDB9.3f4a5b6c...",
  "username": "alice",
  "expiresIn": 86400,
  "tokenType": "Bearer"
}
```

**Response (401)**
```json
{
  "success": false,
  "error": "Invalid signature. Wrong password or corrupted data"
}
```

**Response (400)**
```json
{
  "success": false,
  "error": "No valid nonce found. Please request a new one at /request-nonce"
}
```

---

### User Profile

**Note**: All profile endpoints require JWT authentication via `Authorization: Bearer <token>` header.

#### GET /user/me
Get authenticated user's profile.

**Request**
```bash
GET /api/user/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200)**
```json
{
  "success": true,
  "username": "alice",
  "didDocument": "did:emberveil:polygon:alice#key-1",
  "metadataCID": "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "isActive": true,
  "registrationTime": 1714652000,
  "registeredAt": "2026-03-31T12:00:00Z"
}
```

**Response (401)**
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

---

#### GET /user/profile/:username
Get another user's profile (authenticated users only).

**Request**
```bash
GET /api/user/profile/bob
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200)**
```json
{
  "success": true,
  "username": "bob",
  "didDocument": "did:emberveil:polygon:bob#key-1",
  "isActive": true,
  "registrationTime": 1714652100,
  "registeredAt": "2026-03-31T12:01:00Z"
}
```

**Response (403)**
```json
{
  "success": false,
  "error": "Forbidden: Cannot access other users' profiles"
}
```

---

#### GET /user/public/:username
Check if a user exists (public endpoint).

**Request**
```bash
GET /api/user/public/alice
```

**Response (200)**
```json
{
  "success": true,
  "username": "alice",
  "exists": true
}
```

**Response (404)**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

## Authentication

### JWT Bearer Tokens

Include JWT in `Authorization` header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFsaWNlIn0.signature
```

### Token Payload

```json
{
  "username": "alice",
  "iat": 1714652000,
  "exp": 1714738400
}
```

- `iat`: Issued at (Unix timestamp)
- `exp`: Expires at (Unix timestamp) — 24 hours from `iat`
- **Always check expiration client-side**

### Token Refresh

Re-authenticate to get a new token:

```bash
POST /api/auth/request-nonce          # Get nonce
POST /api/auth/verify-signature       # Sign & get new token
```

---

## Rate Limiting

**Current**: No rate limiting (add in production)

**Recommended limits** (to implement):
- `POST /auth/register`: 5 per hour per IP
- `POST /auth/request-nonce`: 10 per minute per IP
- `POST /auth/verify-signature`: 5 per minute per username

---

## Data Validation

### Username
- Length: 2-32 characters
- Characters: `a-z`, `A-Z`, `0-9`, `-`, `_`
- Case-insensitive (stored lowercase)

### Ed25519 Public Key
- Format: Hex string
- Length: Exactly 64 characters (32 bytes)
- Pattern: `^[0-9a-fA-F]{64}$`

### Password Double Hash
- Format: Hex string with `0x` prefix
- Length: Exactly 66 characters (`0x` + 64 hex)
- Pattern: `^0x[0-9a-fA-F]{64}$`

### Ed25519 Signature
- Format: Hex string
- Length: Exactly 128 characters (64 bytes)
- Pattern: `^[0-9a-fA-F]{128}$`

---

## Response Format

### Success Response
```json
{
  "success": true,
  "username": "alice",
  "token": "...",
  "message": "Optional message",
  "timestamp": "2026-03-31T12:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field": "error about field"
  },
  "timestamp": "2026-03-31T12:00:00Z"
}
```

---

## Examples

### cURL

**Register User**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "didDocument": "did:emberveil:polygon:alice#key-1",
    "ed25519PublicKey": "ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdef",
    "passwordDoubleHash": "0x3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f"
  }'
```

**Request Nonce**
```bash
curl -X POST http://localhost:8080/api/auth/request-nonce \
  -H "Content-Type: application/json" \
  -d '{"username": "alice"}'
```

**Verify Signature**
```bash
curl -X POST http://localhost:8080/api/auth/verify-signature \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "signature": "ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdefab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdef"
  }'
```

**Get Profile**
```bash
curl -X GET http://localhost:8080/api/user/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript (Node.js)

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:8080/api'
});

// Register
async function register() {
  const res = await client.post('/auth/register', {
    username: 'alice',
    didDocument: 'did:emberveil:polygon:alice#key-1',
    ed25519PublicKey: 'ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdef',
    passwordDoubleHash: '0x3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f'
  });
  console.log(res.data);
}

// Login
async function login() {
  const nonce = await client.post('/auth/request-nonce', {
    username: 'alice'
  });
  
  const token = await client.post('/auth/verify-signature', {
    username: 'alice',
    signature: '...' // Signed nonce
  });
  
  return token.data.token;
}
```

---

## Deployment

### Render
```bash
# Connect GitHub repo to Render
# Configure these environment variables:
CONTRACT_ADDRESS=0x...
RELAY_PRIVATE_KEY=0x...
JWT_SECRET=your-secret-key
```

### Railway/Heroku
```bash
# Config vars
CONTRACT_ADDRESS
RELAY_PRIVATE_KEY   
JWT_SECRET
RPC_URL (optional)
```

---

## Versioning

**Current**: v2.0.0  
**Protocol**: Ed25519 Challenge-Response  
**Blockchain**: Polygon Amoy (ChainID: 80002)

**Breaking Changes** will increment major version:
- v2.x.x → Changes within Ed25519 auth
- v3.x.x → New authentication protocol

---

## Support

- **Issues**: GitHub Issues
- **Docs**: https://github.com/yourusername/Emberveil/docs
- **Discord**: https://discord.gg/emberveil
- **Email**: team@emberveil.com
