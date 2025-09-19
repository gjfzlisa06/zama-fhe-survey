// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Plain satisfaction survey contract (no encryption)
/// @notice Admin can create questions; users submit ratings (1..5) in plaintext.
///         Everyone can read participant count, average, max, min.
contract Survey {
    address public admin;

    struct Question {
        string text;
        uint32 totalResponses;
        uint32 totalScore;
        uint8 highest;
        uint8 lowest;
        bool exists;
    }

    Question[] public questions;

    event QuestionCreated(uint256 indexed index, string text);
    event ResponseSubmitted(uint256 indexed index, address indexed responder, uint8 score);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Create a new survey question
    function createQuestion(string memory _text) external onlyAdmin {
        Question memory q;
        q.text = _text;
        q.totalResponses = 0;
        q.totalScore = 0;
        q.highest = 0;
        q.lowest = type(uint8).max;
        q.exists = true;

        questions.push(q);
        emit QuestionCreated(questions.length - 1, _text);
    }

    /// @notice Submit a rating between 1 and 5
    function submitResponse(uint256 _index, uint8 _score) external {
        require(_index < questions.length, "Invalid question");
        require(_score >= 1 && _score <= 5, "Score must be 1..5");

        Question storage q = questions[_index];
        require(q.exists, "Question does not exist");

        q.totalResponses += 1;
        q.totalScore += _score;

        if (_score > q.highest) q.highest = _score;
        if (_score < q.lowest) q.lowest = _score;

        emit ResponseSubmitted(_index, msg.sender, _score);
    }

    /// @notice Return number of questions
    function getQuestionCount() external view returns (uint256) {
        return questions.length;
    }

    /// @notice Return stats for one question (average is integer division)
    function getQuestionStats(uint256 _index)
        external
        view
        returns (
            string memory text,
            uint32 totalResponses,
            uint32 average,
            uint8 highest,
            uint8 lowest
        )
    {
        require(_index < questions.length, "Invalid question");
        Question storage q = questions[_index];
        uint32 avg = q.totalResponses > 0 ? q.totalScore / q.totalResponses : 0;
        return (q.text, q.totalResponses, avg, q.highest, q.lowest);
    }
}
