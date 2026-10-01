import {X} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import {buildImageUrl,getBuildText,type Build} from '@/lib/builds';
import {BuildTagBadges} from './BuildTags';
import {useLocale} from './Locale';
export function BuildViewDialog({build,onClose,returnFocus}:{build:Build|null;onClose:()=>void;returnFocus:()=>void}){
 const {t,locale}=useLocale();const text=build?getBuildText(build,locale):null;
 return <Dialog open={!!build} onOpenChange={open=>{if(!open)onClose()}}>
  <DialogContent className="build-view-dialog" showCloseButton={false} onCloseAutoFocus={event=>{event.preventDefault();returnFocus()}}>
   {build&&text&&<>
    <div className="build-view-heading"><p className="eyebrow">{t('BUILD DETAILS','ОПИСАНИЕ БИЛДА')}</p><DialogTitle>{text.title}</DialogTitle><BuildTagBadges tags={build.tags??[]}/></div>
    <DialogClose className="build-view-close" aria-label={t('Close build','Закрыть билд')}><X size={22}/></DialogClose>
    <div className="build-view-body"><a href={buildImageUrl(build.image_key)} target="_blank" rel="noreferrer" aria-label={t('Open full-size screenshot','Открыть скриншот в полном размере')}><img src={buildImageUrl(build.image_key)} alt={text.title}/></a><DialogDescription className="build-view-description">{text.description}</DialogDescription></div>
   </>}
  </DialogContent>
 </Dialog>;
}
