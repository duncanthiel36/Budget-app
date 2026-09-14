import "./globals.css";
import { AuthProvider } from "../lib/AuthProvider";

export const metadata = {
  title: "Budget",
  description: "Personal budget tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Budget",
  },
};

export const viewport = {
  themeColor: "#292524",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
