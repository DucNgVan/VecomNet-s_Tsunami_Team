import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { IntroProvider } from "@/context/IntroContext";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { OceanCanvas3D } from "@/components/3d/OceanCanvas3D";
import { ToastProvider } from "@/components/ui/ToastNotification";

export const metadata: Metadata = {
  title: "NÉT | Túi Lưới Tái Chế & Charm Độc Bản Biển Sâu",
  description:
    "Thương hiệu thời trang bền vững tiên phong tại Việt Nam, biến đổi lưới đánh cá vô chủ mắc kẹt đáy biển thành túi xách cao cấp và charm thủy tinh 3D tùy biến thời gian thực.",
  keywords: [
    "túi lưới tái chế",
    "thời trang bền vững",
    "charm rác biển",
    "eco fashion",
    "nét eco",
    "ghost net recycling",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body className="min-h-screen flex flex-col relative selection:bg-sky-200 selection:text-[#0b1e3b]">
        <ToastProvider>
          <CartProvider>
            <IntroProvider>
              {/* Subtle Global 3D Ambient Canvas */}
              <OceanCanvas3D interactive={true} className="fixed inset-0 z-0 opacity-40 pointer-events-none" />

              {/* Floating Navigation */}
              <Navbar />

              {/* Side-over Cart Drawer */}
              <CartDrawer />

              {/* Main Content Area */}
              <main className="flex-1 relative w-full overflow-x-hidden">{children}</main>

              {/* Global Footer */}
              <Footer />
            </IntroProvider>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
