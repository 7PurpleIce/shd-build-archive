'use client';
import {createContext,useContext,useEffect,useState} from 'react';
type Locale='en'|'ru';
const Context=createContext<{locale:Locale;setLocale:(l:Locale)=>void;t:(en:string,ru:string)=>string}>({locale:'en',setLocale:()=>{},t:en=>en});
export function LocaleProvider({children}:{children:React.ReactNode}){const[locale,setLocale]=useState<Locale>('en');useEffect(()=>{try{if(localStorage.getItem('shd-language')==='ru')setLocale('ru')}catch{}},[]);useEffect(()=>{document.documentElement.lang=locale},[locale]);function change(l:Locale){setLocale(l);try{localStorage.setItem('shd-language',l)}catch{}}return <Context.Provider value={{locale,setLocale:change,t:(en,ru)=>locale==='ru'?ru:en}}>{children}</Context.Provider>}
export const useLocale=()=>useContext(Context);
export function LanguageSwitch(){const{locale,setLocale}=useLocale();return <div className="language-switch" aria-label="Language / Язык">{(['en','ru'] as const).map(l=><button key={l} aria-pressed={locale===l} onClick={()=>setLocale(l)}>{l.toUpperCase()}</button>)}</div>}
