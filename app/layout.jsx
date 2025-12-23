import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext"; // Ensure this path matches where you saved AuthContext
import { Toaster } from 'sonner';
import Snow from "./components/Snow";

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
          <Toaster richColors position="top-center" />
          <Snow />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
