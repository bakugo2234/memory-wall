import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Memory Wall — Tường Kỷ Niệm",
  description:
    "Không gian lưu giữ và chia sẻ những khoảnh khắc đáng nhớ cùng nhau.",
  keywords: ["memory wall", "ký niệm", "chia sẻ ảnh", "album"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${outfit.variable} font-outfit antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1e1b4b",
                color: "#e2e8f0",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                borderRadius: "12px",
                fontFamily: "var(--font-outfit)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
