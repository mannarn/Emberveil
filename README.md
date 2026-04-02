# Emberveil: Self-Sovereign Identity Platform

![Emberveil](https://via.placeholder.com/800x200?text=Emberveil+-+Self-Sovereign+Identity)

## Overview

Emberveil is a **self-sovereign identity (SSI) platform** built on Polygon that decouples authentication from infrastructure. Users own their identity through a password-derived EVM wallet and Ed25519 DID signing keypair, enabling true digital sovereignty and portability across any application.

### Core Problem

Today's identity systems are centralized and fragmented:
- Users have hundreds of siloed accounts across platforms
- Personal data is harvested and sold by intermediaries
- Authentication is vulnerable to hacks, third-party breaches, and platform shutdowns
- Users have no portable identity they truly own

### Our Solution

Emberveil provides:
- **True Ownership**: Identity derived from user's password + security answers using PBKDF2
- **Zero Intermediaries**: Direct blockchain verification — the relay validates, doesn't control
- **Universal Compatibility**: One identity, infinite applications (E2EE messaging, document signing, access control, etc.)
- **Maximum Privacy**: Private keys stored locally, never transmitted to servers
- **Challenge-Response Auth**: Ed25519 signatures verified on-chain, zero password exposure

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Git
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/Emberveil.git
cd Emberveil

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure .env with your values
# - PRIVATE_KEY: Your blockchain wallet private key
# - JWT_SECRET: Secret for JWT token signing
# - RELAY_PRIVATE_KEY: Relay server's private key
```

### Run Locally

```bash
# Start the relay server (test environment)
npm run server

# In another terminal, run smart contract tests
npm test

# Deploy contract to Amoy testnet
npm run deploy
```

### Deploy to Render (Production)

```bash
# Push to GitHub
git push origin main

# Connect to Render using the provided Dockerfile
# The emberveil-relay will automatically deploy
```

---

## 📦 Architecture

Emberveil consists of three main components:

### 1. **Smart Contracts** (`/contracts`)
- **UserRegistry.sol**: Stores encrypted user profiles, public keys, and DID documents on Polygon
- Built with Solidity 0.8.19, optimized for gas efficiency
- Uses Hardhat + Ignition for deployment

### 2. **Relay Server** (`/emberveil-relay`)
- Express.js backend deployed on Render.com
- Handles nonce generation, signature verification, JWT issuance
- Never touches user private keys (challenge-response model)
- Endpoints: `/register`, `/login`, `/verify-signature`

### 3. **Frontend** (`/FrontEnd`)
- User-facing authentication UI
- Password + security questions → derive keys locally
- Sign challenge with Ed25519 key → send to relay

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design and diagrams.

---

## 🔐 Security Model

### Authentication Flow

```
1. User enters password + security answers
   └─> Client derives EVM wallet & Ed25519 keypair via PBKDF2

2. Client requests login nonce from relay
   └─> Relay generates random nonce, stores with 5-minute TTL

3. Client signs nonce with Ed25519 private key locally
   └─> Signature never leaves client

4. Client sends username + signature to relay
   └─> Relay fetches ed25519PublicKey from UserRegistry contract
   └─> Relay verifies signature using public key

5. If valid: Relay issues JWT token
   └─> Client uses token for authenticated requests
```

### Key Properties

- ✅ **No passwords transmitted**: Only Ed25519 signatures
- ✅ **No private key exposure**: Keys derived and stored locally
- ✅ **Blockchain-backed identity**: On-chain public key verification
- ✅ **Stateless**: Challenge-response eliminates session state
- ✅ **Relay-resistant**: Relay cannot impersonate users

---

## 📋 API Reference

### POST `/register`
Register a new user account.

```json
{
  "username": "alice",
  "didDocument": "{...}",
  "ed25519PublicKey": "ab123...",
  "passwordDoubleHash": "0x...",
  "metadataCID": "QmXxxx..."
}
```

### POST `/login`
Initiate login — get nonce to sign.

```json
{ "username": "alice" }
```

Response:
```json
{ "nonce": "random-string", "expiresIn": 300 }
```

### POST `/verify-signature`
Submit signed nonce to complete login.

```json
{
  "username": "alice",
  "signature": "0x...",
  "nonce": "random-string"
}
```

Response:
```json
{ "token": "jwt-token", "expiresIn": 3600 }
```

See [docs/api.md](./docs/api.md) for complete API documentation.

---

## 📊 Current Traction

- ✅ Core protocol implemented and tested
- ✅ Smart contract deployed to Polygon Amoy testnet
- ✅ Relay server deployed and running on Render
- ✅ Authentication flow validated
- 🔄 Beta user testing in progress

---

## 🗺️ Roadmap

**Phase 1: Core Validation** (Current)
- [ ] User testing with 100+ beta testers
- [ ] Security audit of smart contracts
- [ ] Performance optimization

**Phase 2: Ecosystem Tools** (Q2 2026)
- [ ] E2EE messaging app as first integrator
- [ ] Document signing service
- [ ] DID resolver API

**Phase 3: Network Effects** (Q3-Q4 2026)
- [ ] OAuth2-compatible adapter for web2 apps
- [ ] Mobile wallet integration
- [ ] Enterprise SSI solutions

See [ROADMAP.md](./ROADMAP.md) for detailed timeline.

---

## 🛠️ Development

### Project Structure

```
Emberveil/
├── contracts/              # Solidity smart contracts
│   ├── UserRegistry.sol
│   ├── test/              # Contract tests
│   └── hardhat.config.cjs
├── emberveil-relay/        # Backend relay server (deployed)
│   ├── src/               # Relay application code
│   ├── package.json
│   └── Dockerfile
├── FrontEnd/              # User authentication UI
│   ├── authenticationUI.html
│   └── homeUI.html
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md
│   ├── api.md
│   └── getting-started.md
└── .github/workflows/     # CI/CD pipelines
```

### Testing

```bash
# Run contract tests
npm test

# Run with gas reporter
npm test -- --gas-reporter

# Run with coverage
npm run coverage
```

### Code Style

- **Solidity**: Follow OpenZeppelin conventions
- **JavaScript**: ES6+ modules, ESLint + Prettier configured
- **Comments**: NatSpec for contracts, JSDoc for servers

---

## 📄 License

MIT License — See [LICENSE](./LICENSE) for details.

---

## 👥 Team

- **Founder**: [Your Name]
- **Smart Contract Lead**: [Name]
- **Backend Engineer**: [Name]

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Contact & Resources

- **Website**: [emberveil.com](https://emberveil.com)
- **Twitter**: [@emberveil](https://twitter.com/emberveil)
- **Discord**: [Join Community](https://discord.gg/emberveil)
- **Email**: team@emberveil.com

---

## 🙏 Acknowledgments

Built with:
- [Hardhat](https://hardhat.org/) — Smart contract development
- [Polygon](https://polygon.technology/) — Layer 2 blockchain
- [Express.js](https://expressjs.com/) — Backend framework
- [ethers.js](https://docs.ethers.org/) — Blockchain interface
- [@noble/curves](https://github.com/paulmillr/noble-curves) — Cryptography
