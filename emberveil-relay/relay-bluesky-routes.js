// ================================================================
// EMBERVEIL — Bluesky / AT Protocol Integration Routes
// Paste these routes into your server.js BEFORE the error handler.
// ================================================================

// ── Base58 helper (pure Node.js, no extra deps) ─────────────────────────────────
const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function toBase58(bytes) {
  let n = BigInt('0x' + Buffer.from(bytes).toString('hex'));
  let result = '';
  while (n > 0n) {
    result = BASE58_CHARS[Number(n % 58n)] + result;
    n /= 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    result = '1' + result;
  }
  return result;
}

// ── Per-user did:web DID Document ───────────────────────────────────────────────
//
// Resolves:  did:web:<relay-host>:users:<username>
// Bluesky fetches: GET https://<relay-host>/users/<username>/did.json
//
// This is the BRIDGE: it serves the user's Ed25519 public key (already on-chain
// in UserRegistry.sol) in a did:web document that Bluesky can read, while
// linking back to the user's native did:polygon identity via alsoKnownAs.

app.get('/users/:username/did.json', async (req, res) => {
  try {
    const clean = req.params.username.toLowerCase();

    if (!contract) {
      return res.status(503).json({ error: 'Contract not initialized.' });
    }

    // Check user exists on-chain
    const exists = await contract.registeredUsernames(clean);
    if (!exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Fetch Ed25519 public key from UserRegistry.sol
    const pubKeyHex = await contract.getEd25519PublicKey(clean);
    if (!pubKeyHex) {
      return res.status(404).json({ error: 'Public key not found on-chain.' });
    }

    // Fetch stored DID document to get the polygon DID
    const profile = await contract.getUserProfile(clean);
    let polygonDid = `did:polygon:unknown`;
    try {
      const storedDoc = JSON.parse(profile.didEmberveilDocument);
      polygonDid = storedDoc.id || polygonDid;
    } catch (_) {
      // use fallback
    }

    // Build the did:web identifier for this user
    const relayHost = req.get('host'); // e.g. emberveil.onrender.com
    const webDid    = `did:web:${relayHost}:users:${clean}`;

    // Convert hex pubkey → multibase (base58btc, prefix 'z')
    const pubKeyBytes  = Buffer.from(pubKeyHex, 'hex');
    const multibase    = 'z' + toBase58(pubKeyBytes);

    const didDocument = {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1"
      ],
      "id": webDid,
      // alsoKnownAs links the Bluesky-visible DID back to the polygon DID
      // and registers the AT Protocol handle
      "alsoKnownAs": [
        `at://${clean}.emberveil.id`,
        polygonDid
      ],
      "verificationMethod": [
        {
          "id": `${webDid}#atproto`,
          "type": "Multikey",
          "controller": webDid,
          "publicKeyMultibase": multibase
        }
      ],
      "authentication":  [ `${webDid}#atproto` ],
      "assertionMethod": [ `${webDid}#atproto` ],
      "service": [
        {
          // Required by AT Protocol — tells Bluesky where the PDS lives
          "id": "#atproto_pds",
          "type": "AtprotoPersonalDataServer",
          "serviceEndpoint": `https://${relayHost}`
        },
        {
          // Links back to the Emberveil profile
          "id": "#emberveil",
          "type": "EmberveilProfile",
          "serviceEndpoint": `https://${relayHost}/users/${clean}`
        }
      ]
    };

    // CORS headers required so Bluesky's resolver can fetch cross-origin
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // cache 1 hr
    res.json(didDocument);

    console.log(`◈ did:web served for ${clean}`);

  } catch (err) {
    console.error('did:web route error:', err.message);
    res.status(500).json({ error: 'Failed to generate DID document.' });
  }
});


// ── Relay-level did:web DID Document ────────────────────────────────────────────
//
// Resolves:  did:web:<relay-host>
// Bluesky fetches: GET https://<relay-host>/.well-known/did.json

app.get('/.well-known/did.json', (req, res) => {
  const relayHost = req.get('host');
  const webDid    = `did:web:${relayHost}`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    "@context": [
      "https://www.w3.org/ns/did/v1"
    ],
    "id": webDid,
    "service": [
      {
        "id": "#atproto_pds",
        "type": "AtprotoPersonalDataServer",
        "serviceEndpoint": `https://${relayHost}`
      }
    ]
  });
});


// ── AT Protocol handle verification endpoint ─────────────────────────────────────
//
// Bluesky uses this to confirm that a custom domain handle maps to a DID.
// Verifies: GET https://<relay-host>/.well-known/atproto-did
//
// For per-user custom handles like username.emberveil.xyz you would instead
// add a DNS TXT record:  _atproto.emberveil.xyz  →  "did=did:web:..."
// This endpoint covers the HTTP-based verification fallback.

app.get('/.well-known/atproto-did', (req, res) => {
  const relayHost = req.get('host');
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(`did:web:${relayHost}`);
});


// ── OPTIONS preflight for CORS (Bluesky DID resolvers may send these) ───────────
app.options('/users/:username/did.json', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});


// ================================================================
// DNS TXT RECORD (do this in Cloudflare — not in code)
// ================================================================
//
// For the Bluesky handle  @username.emberveil.xyz  to work:
//
//   Type:    TXT
//   Name:    _atproto.emberveil.xyz
//   Value:   did=did:web:emberveil.onrender.com:users:<username>
//   TTL:     Auto
//
// After this, Bluesky will verify your handle via DNS and link it
// to the did:web DID document served by the route above.
//
// ================================================================
// HOW TO TEST THE BRIDGE
// ================================================================
//
// 1. Check your relay is live:
//    curl https://emberveil.onrender.com/api/health
//
// 2. Resolve a user's did:web document:
//    curl https://emberveil.onrender.com/users/<username>/did.json
//
// 3. Verify it contains the correct Ed25519 pubkey (should match
//    what UserRegistry.sol returns for getEd25519PublicKey(<username>))
//
// 4. In Bluesky's debug tool (https://bsky.app/debug) enter:
//    did:web:emberveil.onrender.com:users:<username>
//    and it should resolve with your Emberveil public key.
//
// ================================================================
