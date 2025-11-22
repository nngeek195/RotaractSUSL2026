import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext"; // Ensure this path matches where you saved AuthContext

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Rotaract SUSL",
  description: "Serve. Grow. Lead.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}