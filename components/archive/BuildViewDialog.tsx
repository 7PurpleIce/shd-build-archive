import {buildCalculatorPreset} from '@/lib/build-calculator-links';
import {X,Calculator} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import {buildImageUrl,getBuildText,type Build} from '@/lib/builds';
import {BuildTagBadges} from './BuildTags';
import {useLocale} from './Locale';
export function BuildViewDialog({build,onClose,returnFocus,onOpenCalculator}:{build:Build|null;onClose:()=>void;returnFocus:()=>void;onOpenCalculator?:(presetId:string)=>void}){
 const {t,locale}=useLocale();const text=build?getBuildText(build,locale):null;const presetId=build?buildCalculatorPreset(build.id):undefined;
 return <Dialog open={!!build} onOpenChange={open=>{if(!open)onClose()}}>
  <DialogContent className="build-view-dialog" showCloseButton={false} onCloseAutoFocus={event=>{event.preventDefault();returnFocus()}}>
   {build&&text&&<>
    <div className="build-view-heading"><p className="eyebrow">{t('BUILD DETAILS','ОПИСАНИЕ БИЛДА')}</p><DialogTitle>{text.title}</DialogTitle><div className="build-view-tag-actions"><BuildTagBadges tags={build.tags??[]}/>{presetId&&onOpenCalculator&&<button type="button" className="secondary-button build-calculator-button" onClick={()=>onOpenCalculator(presetId)}><Calculator size={16}/>{t("View in damage calculator","Посмотреть в калькуляторе урона")}</button>}</div></div>
    <DialogClose className="build-view-close" aria-label={t('Close build','Закрыть билд')}><X size={22}/></DialogClose>
    <div className="build-view-body"><a href={buildImageUrl(build.image_key)} target="_blank" rel="noreferrer" aria-label={t('Open full-size screenshot','Открыть скриншот в полном размере')}><img src={buildImageUrl(build.image_key)} alt={text.title}/></a><DialogDescription className="build-view-description">{text.description}</DialogDescription></div>
   </>}
  </DialogContent>
 </Dialog>;
}
