"use client";
import {createContext, useContext} from "react";

export type HeroFocus = {blockId: string; index: number; target?:"background"|"story"} | null;
const HeroFocusContext = createContext<{focus: HeroFocus; setFocus: (focus: HeroFocus) => void; select?:(blockId:string,index:number)=>void}>({focus: null, setFocus: () => {}});
export const HeroFocusProvider = HeroFocusContext.Provider;
export const useHeroFocus = () => useContext(HeroFocusContext);
