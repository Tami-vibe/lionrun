import type { Metadata } from "next";
import {Syne,Manrope} from "next/font/google";
const displayFont=Syne({subsets:["latin"],variable:"--font-display",display:"swap"});
const textFont=Manrope({subsets:["latin"],variable:"--font-text",display:"swap"});
import "./globals.css";
import "./studio.css";
import "./site/site.css";
import "./media/media.css";
export const metadata: Metadata = { title: "Business Builder | Visual Website Studio", description: "Responsive business website editor prototype" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${displayFont.variable} ${textFont.variable}`}>{children}</body></html>; }
