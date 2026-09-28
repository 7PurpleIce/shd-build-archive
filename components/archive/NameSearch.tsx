'use client';
import {Search,X} from 'lucide-react';
import {useLocale} from './Locale';
export function startsWithName(query:string,...names:(string|undefined)[]){const prefix=query.trim().normalize('NFKC').toLocaleLowerCase();return !prefix||names.some(name=>name?.normalize('NFKC').toLocaleLowerCase().startsWith(prefix))}
export function NameSearch({value,onChange}:{value:string;onChange:(value:string)=>void}){const{t}=useLocale();return <div className="name-search"><Search size={18}/><input type="search" value={value} onChange={e=>onChange(e.target.value)} aria-label={t('Search by name','Поиск по названию')} placeholder={t('Search by name — starts with…','Поиск по началу названия…')}/>{value&&<button aria-label={t('Clear search','Очистить поиск')} onClick={()=>onChange('')}><X size={17}/></button>}</div>}
export function NoSearchResults(){const{t}=useLocale();return <p className="search-empty" role="status">{t('No matching names. Try another prefix.','Ничего не найдено. Попробуй другое начало названия.')}</p>}
