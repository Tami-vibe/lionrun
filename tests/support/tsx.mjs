import {existsSync, readFileSync} from 'node:fs';
import ts from 'typescript';

export async function resolve(specifier,context,next) {
  if(specifier.endsWith('.tsx'))return {url:new URL(specifier,context.parentURL).href,shortCircuit:true};
  if((specifier.startsWith('./')||specifier.startsWith('../'))&&!/\.[a-z]+$/.test(specifier)) {
    const url=new URL(specifier+'.tsx',context.parentURL);
    if(existsSync(url))return {url:url.href,shortCircuit:true};
  }
  return next(specifier,context);
}
export async function load(url,context,next) {
  if(url.endsWith('.tsx'))return {format:'module',shortCircuit:true,source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText};
  return next(url,context);
}
