import {BUILD_TAGS,type BuildTag} from '@/lib/builds';
import {useLocale} from './Locale';

export function BuildTagFilter({selected,onChange}:{selected:BuildTag[];onChange:(tags:BuildTag[])=>void}){
 const {t}=useLocale();
 return <fieldset className="build-tag-filter"><legend>{t('Filter by tags','Фильтр по тегам')}</legend><div className="build-tag-options">{BUILD_TAGS.map(tag=><label className="build-tag-option" key={tag}><input type="checkbox" checked={selected.includes(tag)} onChange={e=>onChange(e.target.checked?[...selected,tag]:selected.filter(value=>value!==tag))}/><span>{tag}</span></label>)}{selected.length>0&&<button type="button" className="build-tag-reset" onClick={()=>onChange([])}>{t('Reset','Сбросить')}</button>}</div><p>{t('Matches all selected tags.','Показаны билды со всеми выбранными тегами.')}</p></fieldset>;
}
export function BuildTagFields({tags,disabled}:{tags:BuildTag[];disabled:boolean}){
 const {t}=useLocale();
 return <fieldset className="build-tag-filter" disabled={disabled}><legend>{t('Build tags','Теги билда')}</legend><div className="build-tag-options">{BUILD_TAGS.map(tag=><label className="build-tag-option" key={tag}><input name="tags" type="checkbox" value={tag} defaultChecked={tags.includes(tag)}/><span>{tag}</span></label>)}</div><p>{t('Select one or more tags, or leave the build untagged.','Выбери один или несколько тегов либо оставь билд без тегов.')}</p></fieldset>;
}
export function BuildTagBadges({tags}:{tags:BuildTag[]}){
 const {t}=useLocale();
 if(!tags.length)return null;
 return <ul className="build-tag-badges" aria-label={t('Build tags','Теги билда')}>{tags.map(tag=><li key={tag}>{tag}</li>)}</ul>;
}
