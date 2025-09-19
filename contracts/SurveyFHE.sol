// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted satisfaction survey using FHE (no FHE.div used)
/// @notice All numeric stats remain encrypted (euint32). Average is computed off-chain by an authorized decrypter.
contract SurveyFHE is SepoliaConfig {
    address public admin;
    /// optional address of a trusted decrypter/oracle allowed to publish plaintext stats
    address public decrypter;

    struct EncQuestion {
        string text;          // plain text question
        euint32 total;        // encrypted count
        euint32 sum;          // encrypted sum of scores
        euint32 highest;      // encrypted maximum score
        euint32 lowest;       // encrypted minimum score (initialized by admin with a big constant)
        bool exists;
    }

    // Plaintext stats published by the authorized decrypter (optional)
    struct PlainStats {
        uint32 totalResponses;
        uint32 sum;
        uint32 average; // integer average (sum / total)
        uint8 highest;
        uint8 lowest;
        bool exists;
    }

    EncQuestion[] public questions;
    mapping(uint256 => PlainStats) public plainStats; // index -> published plaintext stats

    event EncryptedQuestionCreated(uint256 indexed index, string text);
    event EncryptedResponseSubmitted(uint256 indexed index, address indexed sender);
    event DecrypterChanged(address indexed oldDecrypter, address indexed newDecrypter);
    event PlainStatsPublished(uint256 indexed index, uint32 totalResponses, uint32 sum, uint32 average, uint8 highest, uint8 lowest);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyDecrypter() {
        require(decrypter != address(0), "Decrypter not set");
        require(msg.sender == decrypter, "Only decrypter");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Set an address (oracle/service) allowed to publish plaintext stats.
    /// @dev Set to address(0) to disable.
    function setDecrypter(address _decrypter) external onlyAdmin {
        address old = decrypter;
        decrypter = _decrypter;
        emit DecrypterChanged(old, _decrypter);
    }

    /// @notice Create an encrypted question. _initialLowest should be an encryption of a large value (e.g., uint32_max).
    function createEncryptedQuestion(
        string memory _text,
        externalEuint32 _initialLowest,
        bytes calldata _proof
    ) external onlyAdmin {
        euint32 initialLowest = FHE.fromExternal(_initialLowest, _proof);

        questions.push();
        uint256 idx = questions.length - 1;
        EncQuestion storage q = questions[idx];

        q.text = _text;
        q.lowest = initialLowest; // other fields default to encrypted 0
        q.exists = true;

        // Allow contract to operate on lowest
        FHE.allowThis(q.lowest);

        // Optionally allow the configured decrypter to decrypt this initialLowest
        if (decrypter != address(0)) {
            FHE.allow(q.lowest, decrypter);
        }

        emit EncryptedQuestionCreated(idx, _text);
    }

    /// @notice Submit an encrypted response. Caller provides encrypted score (1..5) and encrypted constant 1.
    function submitEncryptedResponse(
        uint256 _index,
        externalEuint32 _encScore,
        bytes calldata _scoreProof,
        externalEuint32 _encOne,
        bytes calldata _oneProof
    ) external {
        require(_index < questions.length, "Invalid index");
        EncQuestion storage q = questions[_index];
        require(q.exists, "Question does not exist");

        // Convert external ciphertext + proof into internal euint32
        euint32 score = FHE.fromExternal(_encScore, _scoreProof);
        euint32 one   = FHE.fromExternal(_encOne, _oneProof);

        // Homomorphic updates: sum += score; total += 1; max/min update
        q.sum   = FHE.add(q.sum, score);
        q.total = FHE.add(q.total, one);
        q.highest = FHE.max(q.highest, score);
        q.lowest  = FHE.min(q.lowest, score);

        // Ensure contract can operate on these ciphertexts later
        FHE.allowThis(q.sum);
        FHE.allowThis(q.total);
        FHE.allowThis(q.highest);
        FHE.allowThis(q.lowest);

        // Allow transaction sender to access/decrypt (so submitter can request plaintext if permitted)
        FHE.allow(q.sum, msg.sender);
        FHE.allow(q.total, msg.sender);
        FHE.allow(q.highest, msg.sender);
        FHE.allow(q.lowest, msg.sender);

        // Also allow the configured decrypter (if any)
        if (decrypter != address(0)) {
            FHE.allow(q.sum, decrypter);
            FHE.allow(q.total, decrypter);
            FHE.allow(q.highest, decrypter);
            FHE.allow(q.lowest, decrypter);
        }

        emit EncryptedResponseSubmitted(_index, msg.sender);
    }

    /// @notice Return encrypted stats (ciphertexts). No on-chain division is attempted.
    /// @dev Off-chain authorized parties must decrypt `sum` and `total` to compute average.
    function getEncryptedQuestionStats(uint256 _index)
        external
        view
        returns (
            string memory text,
            euint32 total,
            euint32 sum,
            euint32 highest,
            euint32 lowest
        )
    {
        require(_index < questions.length, "Invalid index");
        EncQuestion storage q = questions[_index];
        return (q.text, q.total, q.sum, q.highest, q.lowest);
    }

    function getEncryptedQuestionCount() external view returns (uint256) {
        return questions.length;
    }

    /// @notice Called by the authorized decrypter to publish plaintext stats after decrypting.
    /// @dev The contract trusts the configured decrypter to publish correct decrypted values.
    function publishPlainStats(
        uint256 _index,
        uint32 _totalResponses,
        uint32 _sum,
        uint32 _average,
        uint8 _highest,
        uint8 _lowest
    ) external onlyDecrypter {
        require(_index < questions.length, "Invalid index");

        plainStats[_index] = PlainStats({
            totalResponses: _totalResponses,
            sum: _sum,
            average: _average,
            highest: _highest,
            lowest: _lowest,
            exists: true
        });

        emit PlainStatsPublished(_index, _totalResponses, _sum, _average, _highest, _lowest);
    }

    /// @notice Read the plaintext stats previously published by the decrypter.
    function getPlainStats(uint256 _index)
        external
        view
        returns (
            bool exists,
            uint32 totalResponses,
            uint32 sum,
            uint32 average,
            uint8 highest,
            uint8 lowest
        )
    {
        PlainStats storage p = plainStats[_index];
        return (p.exists, p.totalResponses, p.sum, p.average, p.highest, p.lowest);
    }
}
