"use client";
import {createContext, useContext} from "react";

export type HeroFocus = {blockId: string; index: number} | null;
const HeroFocusContext = createContext<{focus: HeroFocus; setFocus: (focus: HeroFocus) => void}>({focus: null, setFocus: () => {}});
export const HeroFocusProvider = HeroFocusContext.Provider;
export const useHeroFocus = () => useContext(HeroFocusContext);
