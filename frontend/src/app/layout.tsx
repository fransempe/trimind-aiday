import type { Metadata } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ProtocolBand } from "@/components/layout/protocol-band";
import { SetupGate } from "@/components/setup-gate";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TriMind AI",
  description: "Entrenador multiagente para deportes de resistencia",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`dark ${archivo.variable} ${martian.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TooltipProvider>
          <SetupGate />
          <div className="flex min-h-dvh flex-col lg:flex-row">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <ProtocolBand />
              <main className="mx-auto w-full max-w-[1480px] min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
                {children}
              </main>
            </div>
          </div>
          <Toaster theme="dark" position="bottom-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
