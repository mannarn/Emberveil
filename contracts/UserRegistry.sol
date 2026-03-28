// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title  UserRegistry
 * @notice Emberveil identity registry on Polygon Amoy.
 *
 * Auth model (challenge-response, never on-chain verification):
 *  - Registration stores: DID document, Ed25519 public key, double-hashed password
 *  - Sign-in is done OFF-CHAIN by the relay:
 *      1. Relay issues a random nonce to the client
 *      2. Client re-derives Ed25519 private key via PBKDF2, signs the nonce
 *      3. Relay fetches ed25519PublicKey from this contract
 *      4. Relay verifies the Ed25519 signature — if valid, issues JWT
 *  - passwordDoubleHash is stored only as a last-resort account recovery
 *    fallback (e.g. if the user loses their salt/security answers).
 *    It is NEVER compared on-chain during normal sign-in.
 */
contract UserRegistry {

    struct UserProfile {
        string  didEmberveilDocument;  // DID document JSON or CID
        string  metadataCID;           // IPFS CID of extended user metadata
        string  ed25519PublicKey;      // hex-encoded Ed25519 public key (64 hex chars)
        string  passwordDoubleHash;    // keccak256( keccak256(PBKDF2-derived-bytes) ) — hex string
        uint256 registrationTime;
        bool    isActive;
    }

    mapping(string => UserProfile) private userRegistry;
    mapping(string => bool)        public  registeredUsernames;

    address public owner;
    uint256 public totalUsers;

    // ── Events ─────────────────────────────────────────────────────

    event UserRegistered(
        string  indexed username,
        string          didEmberveilDocument,
        string          ed25519PublicKey,
        uint256         timestamp
    );

    event DIDDocumentUpdated(
        string  indexed username,
        string          newDidEmberveilDocument,
        uint256         timestamp
    );

    event UserDeactivated(string indexed username, uint256 timestamp);

    // ── Modifiers ──────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier usernameNotTaken(string calldata username) {
        require(!registeredUsernames[username], "Username already registered");
        _;
    }

    modifier userExists(string calldata username) {
        require(registeredUsernames[username], "User does not exist");
        _;
    }

    modifier validUsername(string calldata username) {
        uint256 len = bytes(username).length;
        require(len >= 2 && len <= 32, "Username must be 2-32 characters");
        _;
    }

    modifier validDID(string calldata didDocument) {
        require(bytes(didDocument).length > 0, "DID document cannot be empty");
        _;
    }

    modifier validPublicKey(string calldata pubKey) {
        // Ed25519 public key = 32 bytes = 64 hex characters
        require(bytes(pubKey).length == 64, "Ed25519 public key must be 64 hex chars");
        _;
    }

    // ── Constructor ────────────────────────────────────────────────

    constructor() {
        owner      = msg.sender;
        totalUsers = 0;
    }

    // ── Registration ───────────────────────────────────────────────

    /**
     * @notice Register a new user.
     * @param username           Lowercase alphanumeric username (2-32 chars)
     * @param didDocument        DID document JSON string or IPFS CID
     * @param ed25519PublicKey   Hex-encoded Ed25519 public key (64 hex chars, no 0x prefix)
     * @param passwordDoubleHash keccak256(keccak256(PBKDF2Bytes)) as a hex string — for recovery only
     */
    function registerUser(
        string calldata username,
        string calldata didDocument,
        string calldata ed25519PublicKey,
        string calldata passwordDoubleHash
    )
        external
        validUsername(username)
        validDID(didDocument)
        usernameNotTaken(username)
        validPublicKey(ed25519PublicKey)
        returns (bool)
    {
        require(bytes(passwordDoubleHash).length == 66, "passwordDoubleHash must be 66 chars (0x + 64 hex)");

        userRegistry[username] = UserProfile({
            didEmberveilDocument: didDocument,
            metadataCID:          "",
            ed25519PublicKey:     ed25519PublicKey,
            passwordDoubleHash:   passwordDoubleHash,
            registrationTime:     block.timestamp,
            isActive:             true
        });

        registeredUsernames[username] = true;
        totalUsers++;

        emit UserRegistered(username, didDocument, ed25519PublicKey, block.timestamp);
        return true;
    }

    // ── Read functions ─────────────────────────────────────────────

    function getUserProfile(string calldata username)
        external view
        userExists(username)
        returns (UserProfile memory)
    {
        return userRegistry[username];
    }

    function getEd25519PublicKey(string calldata username)
        external view
        userExists(username)
        returns (string memory)
    {
        require(userRegistry[username].isActive, "User is deactivated");
        return userRegistry[username].ed25519PublicKey;
    }

    function getDIDDocument(string calldata username)
        external view
        userExists(username)
        returns (string memory)
    {
        require(userRegistry[username].isActive, "User is deactivated");
        return userRegistry[username].didEmberveilDocument;
    }

    function isUsernameAvailable(string calldata username)
        external view
        validUsername(username)
        returns (bool)
    {
        return !registeredUsernames[username];
    }

    function isUserActive(string calldata username)
        external view
        userExists(username)
        returns (bool)
    {
        return userRegistry[username].isActive;
    }

    // ── Update ─────────────────────────────────────────────────────

    /**
     * @notice Update DID document. Only callable by the relay (owner).
     *         The relay must have already verified the user's Ed25519 signature
     *         off-chain before calling this.
     */
    function updateDIDDocument(
        string calldata username,
        string calldata newDidDocument
    )
        external
        onlyOwner
        validDID(newDidDocument)
        userExists(username)
        returns (bool)
    {
        require(userRegistry[username].isActive, "User is deactivated");
        userRegistry[username].didEmberveilDocument = newDidDocument;
        emit DIDDocumentUpdated(username, newDidDocument, block.timestamp);
        return true;
    }

    /**
     * @notice Update metadata CID. Only callable by relay after off-chain auth.
     */
    function updateMetadataCID(
        string calldata username,
        string calldata newCID
    )
        external
        onlyOwner
        userExists(username)
        returns (bool)
    {
        require(bytes(newCID).length > 0, "CID cannot be empty");
        require(userRegistry[username].isActive, "User is deactivated");
        userRegistry[username].metadataCID = newCID;
        return true;
    }

    // ── Admin ──────────────────────────────────────────────────────

    function deactivateUser(string calldata username)
        external
        onlyOwner
        userExists(username)
    {
        userRegistry[username].isActive = false;
        emit UserDeactivated(username, block.timestamp);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
