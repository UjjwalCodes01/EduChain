"use client";
import { useState, useEffect } from "react";
import Threads from "../components/Threads";
import { ethers } from "ethers";

export default function Home() {
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    // Check if wallet is already connected on mount
    useEffect(() => {
        checkWalletConnection();
    }, []);

    const checkWalletConnection = async () => {
        if (typeof window !== "undefined" && window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    setWalletAddress(accounts[0].address);
                }
            } catch (error) {
                console.error("Error checking wallet connection:", error);
            }
        }
    };

    const connectWallet = async () => {
        if (typeof window !== "undefined" && window.ethereum) {
            try {
                setIsConnecting(true);
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                setWalletAddress(accounts[0]);
                setIsConnecting(false);
            } catch (error) {
                console.error("Error connecting wallet:", error);
                setIsConnecting(false);
                alert("Failed to connect wallet. Please try again.");
            }
        } else {
            alert("Please install MetaMask to use this application!");
            window.open("https://metamask.io/download/", "_blank");
        }
    };

    const disconnectWallet = () => {
        setWalletAddress("");
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div style={{ width: "100%", position: "relative" }} className="min-h-screen bg-black overflow-x-hidden">
            {/* Background Animation - Behind everything */}
            <div className="fixed inset-0 z-0">
                <Threads amplitude={1.5} distance={0} enableMouseInteraction={false} />
            </div>
            
            {/* All Content on top of Threads */}
            <div className="relative z-10">
                {/* Header */}
                <header className="px-8 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-3xl">🎓</span>
                    <h1 className="text-2xl font-bold text-white">EduChain</h1>
                </div>
                
                {/* Wallet Connection */}
                {walletAddress ? (
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white">
                            {truncateAddress(walletAddress)}
                        </div>
                        <button
                            onClick={disconnectWallet}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md rounded-lg border border-red-500/50 text-red-200 transition-all"
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={connectWallet}
                        disabled={isConnecting}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-semibold transition-all transform hover:scale-105 disabled:opacity-50"
                    >
                        {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </button>
                )}
            </header>

            {/* Hero Section */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Main Heading */}
                    <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 animate-fade-in">
                        Decentralized
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                            Scholarship Platform
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
                        Transparent, fair, and automatic distribution of educational funds using blockchain and smart contracts
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-3 py-6">
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-sm">
                            🔒 Blockchain Secured
                        </div>
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-sm">
                            📝 Smart Contracts
                        </div>
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-sm">
                            🌐 Fully Transparent
                        </div>
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-sm">
                            ⚡ Instant Payments
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                        {walletAddress ? (
                            <>
                                <a
                                    href="/pools"
                                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-xl"
                                >
                                    Browse Scholarships
                                </a>
                                <a
                                    href="/create-pool"
                                    className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white font-bold text-lg transition-all transform hover:scale-105"
                                >
                                    Create Pool
                                </a>
                            </>
                        ) : (
                            <button
                                onClick={connectWallet}
                                disabled={isConnecting}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-xl disabled:opacity-50"
                            >
                                {isConnecting ? "Connecting..." : "Get Started Now"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20">
                    <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                        <h3 className="text-4xl font-bold text-white mb-2">100%</h3>
                        <p className="text-gray-400">Transparent</p>
                    </div>
                    <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                        <h3 className="text-4xl font-bold text-white mb-2">0%</h3>
                        <p className="text-gray-400">Platform Fees</p>
                    </div>
                    <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                        <h3 className="text-4xl font-bold text-white mb-2">Instant</h3>
                        <p className="text-gray-400">Disbursement</p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="max-w-5xl mx-auto mt-24 space-y-8">
                    <h2 className="text-4xl font-bold text-white text-center mb-12">How It Works</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-center">
                            <div className="text-5xl mb-4">🏢</div>
                            <h3 className="text-xl font-bold text-white mb-2">1. Create Pool</h3>
                            <p className="text-gray-400 text-sm">Organizations create scholarship pools on the blockchain</p>
                        </div>
                        
                        <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-center">
                            <div className="text-5xl mb-4">📝</div>
                            <h3 className="text-xl font-bold text-white mb-2">2. Students Apply</h3>
                            <p className="text-gray-400 text-sm">Students submit applications with email verification</p>
                        </div>
                        
                        <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-center">
                            <div className="text-5xl mb-4">✅</div>
                            <h3 className="text-xl font-bold text-white mb-2">3. Admin Reviews</h3>
                            <p className="text-gray-400 text-sm">Pool admins review and approve eligible students</p>
                        </div>
                        
                        <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-center">
                            <div className="text-5xl mb-4">💸</div>
                            <h3 className="text-xl font-bold text-white mb-2">4. Instant Payment</h3>
                            <p className="text-gray-400 text-sm">Smart contracts release funds directly to students</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 py-8 px-4 text-center text-gray-500 border-t border-white/10">
                <p>© 2025 EduChain. Powered by Blockchain Technology.</p>
            </footer>
            </div>
        </div>
    );
}
