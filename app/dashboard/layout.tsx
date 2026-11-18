import type { Metadata, Viewport } from "next";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard trúng quà — Christmas Tree",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
