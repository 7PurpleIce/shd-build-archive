import {ARCHIVE_SECTIONS} from './navigation';
export const TAB_STORAGE_KEY='shd-active-section';
export type OwnerState={canManage:boolean;signedIn:boolean;loading:boolean};
export function ownerCheckStarted(previous:OwnerState,previousUserId:string|undefined,userId:string|undefined):OwnerState {
 return {canManage:!!userId&&userId===previousUserId&&previous.canManage,signedIn:!!userId,loading:!!userId};
}
export function restoreSection(value:string|null){return ARCHIVE_SECTIONS.some(s=>s.id===value)?value!:'sets';}
export function accessibleSection(tab:string,owner:OwnerState){return tab==='damage'&&!owner.loading&&!owner.canManage?'sets':tab;}
export function readSection(){try{return restoreSection(localStorage.getItem(TAB_STORAGE_KEY));}catch{return 'sets';}}
export function saveSection(tab:string){try{localStorage.setItem(TAB_STORAGE_KEY,restoreSection(tab));}catch{/* Storage can be disabled. Navigation still works. */}}
