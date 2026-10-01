import {ARCHIVE_SECTIONS} from './navigation';
export const TAB_STORAGE_KEY='shd-active-section';
export type OwnerState={canManage:boolean;canUseCalculator:boolean;signedIn:boolean;loading:boolean};
export function ownerCheckStarted(previous:OwnerState,previousUserId:string|undefined,userId:string|undefined):OwnerState {
 return {canManage:!!userId&&userId===previousUserId&&previous.canManage,canUseCalculator:!!userId&&userId===previousUserId&&previous.canUseCalculator,signedIn:!!userId,loading:!!userId};
}
export function restoreSection(value:string|null){return ARCHIVE_SECTIONS.some(s=>s.id===value)?value!:'sets';}
export function accessibleSection(tab:string,owner:OwnerState){return tab==='damage'&&!owner.loading&&!owner.canUseCalculator?'sets':tab;}
export function readSection(){try{return restoreSection(localStorage.getItem(TAB_STORAGE_KEY));}catch{return 'sets';}}
export function saveSection(tab:string){try{localStorage.setItem(TAB_STORAGE_KEY,restoreSection(tab));}catch{/* Storage can be disabled. Navigation still works. */}}

/** Only administrator-controlled app metadata may grant tester access. */
export function archivePermissions(isOwner:boolean,appMetadata:Record<string,unknown>={}){
 return {canManage:isOwner,canUseCalculator:isOwner||appMetadata.archive_role==='tester'};
}
