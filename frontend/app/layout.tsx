import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",
    preload: true,
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
    preload: true,
});

export const metadata: Metadata = {
    title: "EduChain - Decentralized Scholarship Platform",
    description: "EduChain brings trust, transparency, and efficiency to educational funding through blockchain technology",
    icons: {
        icon: "/CS_Moon_4.png",
    },
    keywords: ["blockchain", "scholarship", "education", "web3", "decentralized"],
    authors: [{ name: "EduChain Team" }],
    openGraph: {
        title: "EduChain - Decentralized Scholarship Platform",
        description: "Transparent and secure scholarship management on blockchain",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="dns-prefetch" href="https://educhain-kymt.onrender.com" />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                {children}
            </body>
        </html>
    );
}
