import type {Metadata} from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Marne AI Commander",
    description: "Quasi-real-time AI command demo of the First Battle of the Marne"
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    );
}
