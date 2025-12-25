import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext"; // Ensure this path matches where you saved AuthContext
import { Toaster } from 'sonner';
import Snow from "./components/Snow";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL('https://www.rotaractsusl.org'),
  title: "Rotaract SUSL",
  description: "Official website of Rotaract Club of Sabaragamuwa University of Sri Lanka.",
  icons: {
    icon: '/favicon.ico',
  },
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
