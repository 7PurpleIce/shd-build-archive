'use client';
import { useState } from 'react';
import {OwnerProvider,OwnerAuth,useOwner} from './OwnerAuth';
import {assetPath} from '@/lib/supabase';
import { Crosshair, Layers3, LayoutGrid, Zap, LockKeyhole, Atom, Calculator, Store } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Catalog } from './Catalog';
import { Builds } from './Builds';
import { Talents } from './Talents';
import {Augments} from './Augments';
import {Expertise} from './Expertise';
import {Traders} from './Traders';
import {LocaleProvider,LanguageSwitch,useLocale} from './Locale';
function ArchiveContent() {
 const{canManage}=useOwner();
 const{t}=useLocale();const [tab,setTab]=useState('sets');
 return <div className="archive-app"><header className="masthead"><a href={assetPath("/")} className="brand"><span className="brand-mark"><Crosshair size={30}/></span><span>SHD<span className="brand-sub">BUILD ARCHIVE</span></span></a><div className="game-name">TOM CLANCY’S <strong>THE DIVISION <b>2</b></strong></div><div className="private-label"><LanguageSwitch/><OwnerAuth/></div></header><main><Tabs value={tab} onValueChange={setTab}><TabsList className="main-nav" aria-label={t("Site sections","Разделы сайта")}><TabsTrigger value="sets"><Layers3/>{t('Brands & sets','Бренды и сеты')}<span>01</span></TabsTrigger><TabsTrigger value="builds"><LayoutGrid/>{t('Builds','Билды')}<span>02</span></TabsTrigger><TabsTrigger value="talents"><Zap/>{t('Talents','Таланты')}<span>03</span></TabsTrigger><TabsTrigger value="augments"><Atom/>{t('Augments','Аугменты')}<span>04</span></TabsTrigger><TabsTrigger value="expertise"><Calculator/>{t('Expertise calculator','Калькулятор мастерства')}<span>05</span></TabsTrigger><TabsTrigger value="traders"><Store/>{t('Traders','Торговцы')}<span>06</span></TabsTrigger></TabsList><TabsContent value="sets"><Catalog/></TabsContent><TabsContent value="builds"><Builds canManage={canManage}/></TabsContent><TabsContent value="talents"><Talents/></TabsContent><TabsContent value="augments"><Augments/></TabsContent><TabsContent value="expertise"><Expertise/></TabsContent><TabsContent value="traders"><Traders/></TabsContent></Tabs></main><footer><span>SHD ARCHIVE <span className="slash">/</span> THE DIVISION 2</span><span hidden>{t("Data: ","Данные: ")}<a href="https://github.com/div2hub/game-data" target="_blank" rel="noreferrer">div2hub</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · {t("Snapshot 26 Sep 2026","Снимок 26.09.2026")}<br/>{t("Icons: ","Иконки: ")}<a href="https://prototrack.gg/division2-wiki.php" target="_blank" rel="noreferrer">ProtoTrack</a> / <a href="https://hi-dep.github.io/division2/" target="_blank" rel="noreferrer">hi-dep</a> · © Ubisoft / Massive</span></footer></div>
}

export function ArchiveApp(){return <LocaleProvider><OwnerProvider><ArchiveContent/></OwnerProvider></LocaleProvider>}
