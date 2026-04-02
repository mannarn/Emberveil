# 𑀅 Emberveil

**A sovereign identity platform — like MetaMask, but for who you are.**

Every blockchain wallet you have used — MetaMask, Coinbase Wallet, Phantom — starts from one thing: a private key. A cryptographic number that no server holds, no company owns, and no one can take from you. That key becomes your wallet address on Ethereum, Polygon, Base — every chain. Portable. Permanent. Yours.

**Emberveil takes that same idea and applies it to your entire digital identity.**

---

## The Same Wallet Cryptography. Now Your Identity.

When you create an Emberveil account, your password is run through a key derivation function — the same process that secures hardware wallets — and produces two cryptographic keypairs:

- A **secp256k1** keypair — your Polygon wallet address. Your on-chain anchor.
- An **Ed25519** keypair — your signing key for authentication across every Emberveil app.

Your **Decentralized Identifier (DID)** is then registered in a smart contract on Polygon. Not on our servers. On a public, immutable blockchain — the same infrastructure securing billions in crypto assets worldwide.

No seed phrase. No MetaMask required. Just your password, and a cryptographic identity that belongs to you.

---

## Portable. Like a Wallet. But for Everything.

Your Coinbase wallet address works on every EVM chain. Your Emberveil identity works on every platform that speaks the W3C DID standard — which is where the internet is heading.

Take your identity to any Emberveil app. Take it to third-party platforms. Take it anywhere. You are not re-registering. You are not trusting a company to keep your account alive. Your DID moves with you — dispensable infrastructure, indispensable identity.

---

## Identity Is Just the Start

Emberveil is an **identity-first platform**. The DID is the foundation. Built on top of it:

| App | What It Does |
|---|---|
| **Microblogger** | Decentralized social feed — you own your posts and audience |
| **MilComm** | Encrypted messaging — no platform reads your conversations |
| **Emberveil Mail** | Sovereign email tied to your DID, not a corporation |
| **Emberveil Drive** | Personal file storage encrypted to your identity |
| **Emberveil Wallet** | Crypto wallet — same keypair, same identity |

One login. One key. Every app. Forever portable.

---

## Why This Exists

Every time you click *Sign in with Google*, you are renting your identity from a corporation. They store it. They monetize it. They can revoke it.

- Your account gets suspended — you lose access to everything built on top of it.
- The platform goes down — your identity goes down with it.
- You want to leave — you can't take anything with you.

Emberveil is what happens when you apply the philosophy of self-custody — the founding idea of crypto — to identity itself.

---

## Built On

- **Polygon** — on-chain identity registry, immutable and censorship-resistant
- **W3C DID Core Standard** — open, portable, interoperable identity
- **IPFS / Ceramic** — decentralized document and metadata storage
- **Ed25519 + secp256k1** — the same cryptography securing the blockchain ecosystem

---

## Status

Smart contract deployed. Relay live. Auth pipeline working. This is not a concept — it is a running system.

- [x] `UserRegistry.sol` live on Polygon Amoy
- [x] Challenge-response authentication pipeline
- [x] DID registration and resolution
- [ ] Mainnet deployment
- [ ] Microblogger beta

---

## Docs

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system design, cryptographic pipeline, and infrastructure diagrams
- [`ROADMAP.md`](./ROADMAP.md) — v2 decentralized relay mesh, ecosystem rollout, and future plans

---

*Built by **Mannarmannan Thiruvarasan** — solo founder.*

*If Emberveil shuts down tomorrow, every user's identity still exists on Polygon. We built ourselves to be dispensable.*