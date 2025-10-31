"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Threads from "../components/Threads";
import { Button } from "../components/ui/stateful-button";
import { ethers } from "ethers";

export default function Home() {
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const router = useRouter();

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
        <div
            style={{ width: "100%", position: "relative" }}
            className="min-h-screen bg-black overflow-x-hidden flex flex-col"
        >
            {/* Background Animation - Behind everything */}
            <div className="fixed inset-0 z-0">
                <Threads
                    amplitude={1.5}
                    distance={0}
                    enableMouseInteraction={false}
                />
            </div>

            {/* All Content on top of Threads */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <header className="px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-white">
                            EduChain
                        </h1>
                    </div>

                    {/* Wallet Connection */}
                    {walletAddress ? (
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white">
                                {truncateAddress(walletAddress)}
                            </div>
                            <Button
                                onClick={disconnectWallet}
                                disabled={false}
                            >
                                Disconnect
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={connectWallet} disabled={isConnecting}>
                            {isConnecting ? "Connecting..." : "Connect Wallet"}
                        </Button>
                    )}
                </header>

                {/* Hero Section */}
                <div className="relative z-2 flex flex-col items-center grow justify-center px-4 text-center">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Main Heading */}
                        <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 animate-fade-in">
                            Decentralized
                            <br />
                            <span className="bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient">
                                Scholarship Platform
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
                            Transparent, fair, and automatic distribution of
                            educational funds using blockchain and smart
                            contracts
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
                        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">          
                                <button 
                                    onClick={() => router.push('/details')}
                                    className="relative inline-flex h-10 overflow-hidden rounded-full p-px focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                                >
                                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                                        Get Started Now
                                    </span>
                                </button>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed at bottom */}
                <footer className="relative z-10 py-4 mt-auto text-center text-gray-500 border-t border-white/10">
                    <p>© 2025 EduChain. Powered by Blockchain Technology.</p>
                </footer>
            </div>
        </div>
    );
}
