# EduChain

## Problem Statement

Access to scholarships and educational funding is often limited by opaque processes, lack of transparency, and inefficient verification. Students struggle to find and apply for opportunities, while providers face challenges in verifying applicants and distributing funds securely. Traditional systems are slow, prone to fraud, and lack trust between parties.

## Solution: EduChain

EduChain is a decentralized platform that streamlines scholarship management using blockchain and modern web technologies. It solves the above problems by:

- **Transparent Scholarship Pools:** Providers can create and manage scholarship pools on-chain, ensuring all transactions are visible and auditable.
- **Secure Student Applications:** Students apply for scholarships using their wallet address, submit documents, and verify their identity via OTP/email, reducing fraud and manual verification.
- **Automated Verification:** Documents are uploaded to IPFS for tamper-proof storage, and verification is managed via smart contracts and backend logic.
- **Role-Based Access:** The platform distinguishes between students and providers, ensuring each user has access to relevant features and data.
- **Seamless User Experience:** The frontend (Next.js) provides easy registration, wallet connection, and application tracking. The backend (Node.js/Express) handles user onboarding, verification, and database management.
- **Scalable & Secure:** Built on MongoDB Atlas, Render, and Vercel for robust deployment and scalability.

## How EduChain Works

1. **Provider Registration:** Scholarship providers register, verify their email, and create scholarship pools.
2. **Student Registration:** Students register, verify their email, and apply to available pools by submitting required documents.
3. **Application Submission:** All documents are stored on IPFS, and applications are tracked on-chain and in the database.
4. **Verification & Award:** Providers review applications, verify documents, and award scholarships transparently.

## Technologies Used
- **Frontend:** Next.js, React, TypeScript
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Smart Contracts:** Solidity (Foundry/OpenZeppelin)
- **Storage:** IPFS (Pinata/Infura)
- **Deployment:** Vercel (frontend), Render (backend)

## Getting Started

See the full documentation in the `/README.md` and follow setup instructions in each folder (`frontend/`, `backend/`, `contracts/`).

---

EduChain brings trust, transparency, and efficiency to educational funding. Join us in revolutionizing scholarships for everyone!