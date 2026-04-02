# Emberveil Product Roadmap

## Vision

Build the decentralized infrastructure for self-sovereign identity — a world where users own, control, and port their identity across any application without intermediaries.

---

## Roadmap Timeline

### 🟢 Phase 1: Core Validation (Current - Q1 2026)

**Goal**: Validate product-market fit with early users, audit security

#### Q1 2026 (Current)

**by March 31, 2026:**
- ✅ Core authentication protocol implemented
- ✅ Smart contract deployed (Polygon Amoy)
- ✅ Relay server live (Render.com)
- ✅ Basic UI (register/login flow)
- 🔄 Internal beta testing

**by April 30, 2026:**
- [ ] Security audit (contract + relay code)
- [ ] 50+ beta user testers
- [ ] Performance benchmarking (gas costs, latency)
- [ ] Password recovery flow implementation

**Milestones:**
- <100ms average login latency
- Contract gas optimization (target: <500k gas for register)

---

### 🟡 Phase 2: First Integrations (Q2 2026)

**Goal**: Build first E2EE applications using Emberveil identity

#### May - June 2026

**Infrastructure:**
- [ ] Migrate to production blockchain (Polygon PoS)
- [ ] Deploy Redis cluster for relay scalability
- [ ] Setup multi-region relay instances
- [ ] Implement comprehensive monitoring + alerting
- [ ] Create JavaScript SDK for apps

**First Applications:**
- [ ] **Emberveil Messenger**: E2EE chat using Emberveil identity
  - Direct messaging
  - Group chats (invite-based)
  - End-to-end encryption (libsodium)
  - Messages stored on IPFS (user-owned)
  
- [ ] **DID Document Resolver**: Public API to resolve identities
  - REST endpoint: `GET /resolve/:username`
  - Returns DID document, public keys
  - Cached + rate-limited

**Developer Experience:**
- [ ] JavaScript SDK with examples
  - `new EmberveilClient(username, password)`
  - `client.login()` → JWT token
  - `client.signMessage(data)` → Ed25519 signature
  
- [ ] OpenAPI documentation
- [ ] Postman collection

**Metrics:**
- 500+ active users by end of Q2
- 3 partner applications in beta
- <50ms average resolution time

---

### 🟠 Phase 3: Web2 Interoperability (Q3 2026)

**Goal**: Enable "Sign in with Emberveil" for traditional web apps

#### July - September 2026

**OAuth2 Provider:**
```
Traditional App
    ↓
    GET https://emberveil.com/oauth/authorize?client_id=...&redirect_uri=...
    ↓
    User: "Sign in with Emberveil"
    ↓
    Approve scopes (profile, email, etc.)
    ↓
    Redirect to app with authorization_code
    ↓
    App exchanges code for access_token + user profile
```

**Features:**
- [ ] Standardized OAuth2 / OIDC provider
- [ ] Scopes: `profile`, `email`, `signature`
- [ ] User consent UI (permissions screen)
- [ ] Refresh token rotation
- [ ] Rate limiting + abuse prevention

**Integrations:**
- [ ] Stripe: Accept Emberveil auth for merchant dashboards
- [ ] Notion: Login with Emberveil
- [ ] Discord Bot: Emberveil authentication

**Metrics:**
- 10+ integrated web2 services
- 1M total OAuth requests
- <20% abandonment rate on OAuth flow

---

### 🔵 Phase 4: Mobile & Hardware (Q4 2026)

**Goal**: Extend Emberveil to mobile and hardware wallets

#### October - December 2026

**Mobile Wallet:**
- [ ] **React Native SDK** for iOS/Android
  - Local key storage (Secure Enclave / Keystore)
  - Biometric auth (Face ID / Fingerprint)
  - Push notifications for login attempts
  - Background sync for DID updates

- [ ] **Mobile App**: Emberveil Wallet
  - Identity management dashboard
  - Connected apps list (OAuth scopes)
  - Activity log (login history)
  - Recovery phrase backup/restore

**Hardware Wallet Support:**
- [ ] **Ledger Integration**: Sign with hardware key
  - Prompt user on device to confirm
  - No private key exposure
  
- [ ] **Trezor Integration**: Similar flow

**Metrics:**
- 100k+ mobile downloads
- Hardware wallet support tested with 50+ users
- 95%+ successful mobile auth rate

---

### 🟣 Phase 5: Enterprise & Governance (2027 Q1+)

**Goal**: Enterprise-grade SSI for organizations

#### January - March 2027

**Features:**
- [ ] **Organization Namespaces**: `alice@company.emberveil`
- [ ] **Role-Based Access Control** (RBAC)
- [ ] **Audit Logging**: Who accessed what, when
- [ ] **SAML Provider**: Replace corporate SSO with Emberveil
- [ ] **M-of-N Recovery**: Multi-party key recovery
- [ ] **Time-Lock Puzzles**: Future-dated identity recovery

**Compliance:**
- [ ] SOC 2 Type II certification
- [ ] GDPR + data residency options
- [ ] HIPAA compliance (healthcare apps)

**Metrics:**
- 50+ enterprise deployments
- $500k ARR
- 1M+ B2B2C users through integrations

---

### 🎯 Phase 6: Decentralized Relay Network (2027 Q2+)

**Goal**: Users choose relays; relay operators compete on service

#### April+

**Decentralized Relays:**
- [ ] Smart contract: Relay registry with reputation scores
- [ ] Staking: Operators stake tokens for credibility
- [ ] Slashing: Penalties for dishonest relays
- [ ] Client chooses relay: "I trust Relay X more than Y"
- [ ] Multi-relay: Client can verify with multiple relays

**DeFi Integrations:**
- [ ] Collateralized instant loans (borrow against Emberveil identity)
- [ ] Identity bonds (prove you're qualified for governance votes)
- [ ] Credential stacking (combine multiple proofs)

---

## Key Metrics by Phase

| Phase | Timeline | Active Users | Security Incidents | Gas Efficiency | Geographic Coverage |
|-------|----------|:-------------:|:------------------:|:---------------:|:-------------------:|
| **1** | Q1 2026 | 100 | 0 | TBD | North America |
| **2** | Q2 2026 | 500 | 0 | -30% | Multi-region |
| **3** | Q3 2026 | 50k | <0.01% | -50% | Global |
| **4** | Q4 2026 | 100k | <0.01% | -60% | Global |
| **5** | 2027 Q1 | 1M (B2B) | <0.001% | -70% | Global |
| **6** | 2027 Q2+ | 10M | <0.001% | Optimized | Fully distributed |

---

## Technical Debt & Cleanup

### Immediate (Before Phase 2)
- [ ] Add comprehensive unit tests
- [ ] Code coverage >80%
- [ ] Extract relay code to `src/` directory
- [ ] Create TypeScript types for relay API
- [ ] Setup automated contract verification

### Before Production (Polygon PoS)
- [ ] Security audit (contract + relay)
- [ ] Load testing (10k concurrent users)
- [ ] Chaos engineering (relay failure scenarios)
- [ ] Database migration plan (if moving to persistent storage)
- [ ] Backup & disaster recovery procedures

### Long-term
- [ ] Microservices architecture (separate auth, resolver, events)
- [ ] GraphQL API
- [ ] Event-sourced audit log
- [ ] Automated alerting + on-call rotations

---

## Feature Ideas Backlog

### User Experience
- [ ] Social recovery (friends help you recover account)
- [ ] Multi-device login (approve new device from existing device)
- [ ] Passkey support (WebAuthn instead of password)
- [ ] Ledger Live integration
- [ ] Telegram bot for quick authentication

### Privacy Enhancements
- [ ] Zero-knowledge proofs (prove identity without revealing it)
- [ ] Verifiable credentials (signed proofs)
- [ ] Privacy-preserving reputation scores
- [ ] Stealth addresses (unlinkable identities)

### Developer Tools
- [ ] Browser extension for auto-fill + signing
- [ ] CLI tool for identity management
- [ ] GraphQL API for identity queries
- [ ] Webhook support (notify app on user events)

### Compliance & Enterprise
- [ ] SCIM provisioning (bulk user import)
- [ ] SSO dashboard for IT admins
- [ ] Login attempt analytics
- [ ] Geo-location restrictions

---

## Success Criteria by Phase

### Phase 1: Proven Protocol
✓ 100+ users without security incidents
✓ <100ms authentication latency
✓ Security audit passed
✓ Community interest (100+ GitHub stars, active discord)

### Phase 2: Developer Adoption
✓ 3+ production applications using Emberveil
✓ 500+ active users
✓ <50ms identity resolution
✓ Tyler or founders accepted to YC Startup School

### Phase 3: Mainstream
✓ 50k+ users
✓ 10+ integrated web2 services (Slack, Stripe, Notion, etc.)
✓ Emberveil mentioned in major crypto news outlets
✓ B2B customers evaluating for SSO

### Phase 4: Market Leadership
✓ 100k+ users
✓ 50%+ prefer Emberveil over traditional auth
✓ $1M+ ARR
✓ Series A funding completed

---

## Budget Allocation

### Phase 1 (Q1 2026): $50k
- Security audit: $20k
- Infrastructure (Render, AWS): $5k
- Team: $25k (founders)

### Phase 2 (Q2 2026): $200k
- Developer advocacy: $50k
- Infrastructure: $20k
- Team (hire 1 engineer): $100k
- Marketing: $30k

### Phase 3 (Q3 2026): $500k (seeking Pre-A)
- Engineering: $250k (3 engineers)
- Business development: $100k
- Infrastructure: $50k
- Legal/compliance: $50k
- Marketing: $50k

---

## Positioning

### Today
"Emberveil: The self-sovereign identity protocol for Web3"

### 6 months
"Emberveil: The universal login for decentralized internet"

### 12 months
"Emberveil: The identity layer all apps use, none control"

---

## Competitive Landscape

| Solution | Key Strength | Emberveil Advantage |
|----------|--------------|-------------------|
| **Traditional OAuth (Google, GitHub)** | Ubiquitous | User-owned, portable |
| **MetaMask** | Wallet integration | Identity + wallet |
| **ENS** | Domain names | Full identity ecosystem |
| **Worldcoin** | Sybil resistance | Privacy-first design |
| **Veramo** | DID toolkit | Production-ready product |

---

## Call to Action

**For Investors**: Early-stage cryptography + identity company with proven team. Seeking $500k Pre-A for Phase 3 scale.

**For Developers**: Build the next generation of decentralized applications. Start with Emberveil SDK.

**For Users**: Own your identity. Follow [@emberveil](https://twitter.com/emberveil) for updates.

---

**Last Updated**: March 31, 2026  
**Next Review**: April 15, 2026  
**Version**: 1.0.0
