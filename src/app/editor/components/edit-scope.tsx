"use client";
import {createContext, useContext, useId} from "react";
export type EditScope = {id?: string};
export type EditScopeApi = {claim:(id:string)=>void; release:(id:string)=>void};
export const EditScopeContext = createContext<EditScopeApi | null>(null);
export function useEditScope() {
  const scope = useContext(EditScopeContext);
  const id = useId();
  return {
    onFocus: () => scope?.claim(id),
    onBlur: () => scope?.release(id),
  };
}

