import type { Metadata } from "next";
import {Syne, Manrope, Fraunces, Source_Sans_3, Space_Grotesk, IBM_Plex_Sans, Outfit, DM_Sans} from "next/font/google";

const northlineDisplay = Syne({subsets:["latin"], weight:["400","600","700"], variable:"--font-pair-northline-display", display:"swap"});
const northlineText = Manrope({subsets:["latin"], weight:["400","600","700"], variable:"--font-pair-northline-text", display:"swap"});
const editorialDisplay = Fraunces({subsets:["latin"], weight:["400","600","700"], variable:"--font-pair-editorial-display", display:"swap"});
const editorialText = Source_Sans_3({subsets:["latin"], weight:["400","600","700"], variable:"--font-pair-editorial-text", display:"swap"});
const industrialDisplay = Space_Grotesk({subsets:["latin"], weight:["400","600","700"], variable:"--font-pair-industrial-display", display:"swap"});
const industrialText = IBM_Plex_Sans({subsets:["latin"], weight:["400","600","700"], variable:"--font-pair-industrial-text", display:"swap"});
const friendlyDisplay = Outfit({subsets:["latin"], weight:["400","600","700"], variable:"--font-pair-friendly-display", display:"swap"});
const friendlyText = DM_Sans({subsets:["latin"], weight:["400","600","700"], variable:"--font-pair-friendly-text", display:"swap"});

import "./globals.css";
import "./studio.css";
import "./site/site.css";
import "./media/media.css";

export const metadata: Metadata = { title: "Business Builder | Visual Website Studio", description: "Responsive business website editor prototype" };

const fontClasses = [
  northlineDisplay.variable, northlineText.variable,
  editorialDisplay.variable, editorialText.variable,
  industrialDisplay.variable, industrialText.variable,
  friendlyDisplay.variable, friendlyText.variable,
].join(" ");

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={fontClasses}
        style={{
          ["--font-display" as string]: "var(--font-pair-northline-display)",
          ["--font-text" as string]: "var(--font-pair-northline-text)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
