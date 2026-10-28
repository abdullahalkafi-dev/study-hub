import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Shell from "@/components/Shell";

export const metadata: Metadata = { title: "Silo Study Desk", description: "8-month math and physics course with interactive labs." };

// Applies the saved theme and Bangla preference before first paint (no flash).
const preboot = `try{var t=localStorage.getItem("silo-theme");if(t)document.documentElement.setAttribute("data-theme",t);if(localStorage.getItem("silo-nobn")==="true")document.documentElement.classList.add("nobn")}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: preboot }} /></head>
      <body>
        <StoreProvider><Shell>{children}</Shell></StoreProvider>
      </body>
    </html>
  );
}
