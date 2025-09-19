# FHE Survey Platform

A fully homomorphic encryption (FHE) enabled survey system on FHEVM, providing transparent and verifiable survey responses on-chain while ensuring data privacy and integrity.

---

## 🌐 Live Demo

Try the live application: [https://zama-fhe-survey.vercel.app/](https://zama-fhe-survey.vercel.app/)

---

## 🏛️ Project Background

In today's data-driven world, collecting honest feedback is crucial for improving products and services. However, traditional survey systems face significant challenges:

- **Lack of transparency:** Participants cannot verify if their responses are accurately recorded
- **Data tampering risks:** Survey results can be manipulated after collection
- **Privacy concerns:** Respondents may hesitate to provide honest feedback due to privacy concerns

FHE Survey leverages Fully Homomorphic Encryption (FHE) technology to tackle these issues. By performing computations on encrypted data directly on-chain, the system ensures:

- Complete transparency and verifiability of all survey operations
- Immutable records that cannot be altered after submission
- Protection of respondent privacy while maintaining data integrity
- Trustless environment where results can be verified by anyone

---

## 🚀 Features

### Core Functionality

- **Transparent Survey System:** Create and manage survey questions with on-chain verification
- **Anonymous Participation:** Users can submit ratings without exposing their identity
- **Real-time Statistics:** Instant calculation of average scores, response counts, and distribution
- **Administrative Controls:** Admin-only functions for creating survey questions
- **FHEVM Integration:** On-chain data encryption ensures trust and integrity
- **Modern Web Interface:** User-friendly frontend with seamless wallet connectivity

### Privacy & Security

- **Secure Smart Contracts:** Built with audited Solidity libraries
- **Wallet Connection:** Ethereum wallet integration for participation
- **Immutable Records:** Survey data cannot be modified after submission
- **Encrypted Computation:** FHE enables calculations on encrypted data

---

## 🏗️ Architecture

### Smart Contracts

**Survey.sol - Main Contract**

- Manages survey questions and responses
- Stores question data, scores, and statistics on-chain
- Provides admin-only functions for creating questions
- Calculates and updates statistics for each question

### Frontend Application

- **React + TypeScript:** Modern user interface
- **Ethers.js:** Blockchain interaction
- **Vite:** Fast build and hot reload
- **Wallet Integration:** Connect various Ethereum wallets
- **Responsive Design:** Works on desktop and mobile devices
- **Real-time Updates:** Instant reflection of new responses and statistics

---

## 🔧 Technology Stack

### Blockchain

- **Solidity ^0.8.24:** Smart contract development
- **FHEVM:** Fully Homomorphic Encryption Virtual Machine
- **OpenZeppelin:** Secure contract libraries
- **Hardhat:** Development and deployment framework

### Frontend

- **React 18 + TypeScript**
- **Vite:** Build tool and dev server
- **Ethers.js:** Ethereum interaction
- **Custom CSS:** Modern glassmorphism design with blue gradient theme
- **Wallet Integration:** Support for MetaMask, OKX, Coinbase, Trust, and Binance wallets

### Infrastructure

- **Vercel:** Frontend deployment
- **Sepolia Testnet:** Development and testing environment

---

## 📦 Installation

### Prerequisites

- Node.js 20+
- npm / yarn / pnpm
- Ethereum wallet (MetaMask recommended)

### Setup

```bash
# Clone the repository
git clone https://github.com/gjfzlisa06/zama-fhe-survey.git
cd zama-fhe-survey

# Install dependencies
npm install

# Install development dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox

# Install additional required packages
npm install @zama-fhe/relayer-sdk
npm install ethers dotenv
npm install react react-dom

# Compile contracts
npx hardhat compile

# Deploy to network (configure hardhat.config.js first)
npx hardhat run deploy/deploy.ts --network sepolia

# Start the development server
cd frontend
npm run dev   
```

## 🎯 Usage   

Connect Wallet: Click the "Connect Wallet" button and select your preferred Ethereum wallet

View Surveys: Browse existing survey questions and their statistics

Submit Ratings: For each question, click "Submit Score" to provide your rating (1-5)

Create Questions (Admin only): Admins can create new survey questions using the "Create Question" button

Monitor Statistics: View real-time updates of response counts, average scores, and distributions

## 🔒 Security Features

All survey responses are stored on-chain with FHE encryption

Only question owners (admins) can create new questions

Response data is immutable once submitted

Transparent statistics calculation visible to all participants

## 🌟 Future Enhancements

Multi-question survey forms

Advanced data visualization and analytics

Response weighting and filtering options

Export functionality for survey results

Cross-chain compatibility

## 🤝 Contributing

We welcome contributions to the FHE Survey Platform! Please feel free to submit issues, feature requests, or pull requests.

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

ZAMA for FHEVM technology

Ethereum Foundation for blockchain infrastructure

Vercel for deployment platform

All contributors and testers