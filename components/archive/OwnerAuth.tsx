import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {Eye,EyeOff,LockKeyhole,LogOut} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {supabase} from '@/lib/supabase';
import {useLocale} from './Locale';
const OwnerContext=createContext({canManage:false,signedIn:false,loading:true});
export function OwnerProvider({children}:{children:React.ReactNode}){
 const[state,setState]=useState({canManage:false,signedIn:false,loading:true});const revision=useRef(0);
 useEffect(()=>{
  if(!supabase){setState({canManage:false,signedIn:false,loading:false});return;}
  const client=supabase;
  async function resolve(userId?:string){
   const current=++revision.current;setState({canManage:false,signedIn:!!userId,loading:!!userId});
   if(!userId)return;
   const {data,error}=await client.from('archive_owners').select('user_id').eq('user_id',userId).maybeSingle();
   if(current===revision.current)setState({canManage:!error&&!!data,signedIn:true,loading:false});
  }
  // Avoid awaiting database requests inside an Auth state-change callback.
  const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{void resolve(session?.user.id)});
  return()=>{revision.current++;subscription.unsubscribe()};
 },[]);
 return <OwnerContext.Provider value={state}>{children}</OwnerContext.Provider>;
}
export function useOwner(){return useContext(OwnerContext)}
export function OwnerAuth(){
 const{t}=useLocale();const{canManage,signedIn,loading}=useOwner();
 const[ownerEntry,setOwnerEntry]=useState(()=>window.location.hash==='#owner');
 const[open,setOpen]=useState(()=>window.location.hash==='#owner');const[visible,setVisible]=useState(false);const[busy,setBusy]=useState(false);const[error,setError]=useState('');
 useEffect(()=>{
  const syncEntry=()=>{const requested=window.location.hash==='#owner';setOwnerEntry(requested);setOpen(requested)};
  window.addEventListener('hashchange',syncEntry);
  return()=>window.removeEventListener('hashchange',syncEntry);
 },[]);
 useEffect(()=>{
  if(canManage&&ownerEntry){
   window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);
   setOwnerEntry(false);setOpen(false);
  }
 },[canManage,ownerEntry]);
 async function login(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!supabase)return;const form=event.currentTarget;const fields=new FormData(form);setBusy(true);setError('');
  try{const {error}=await supabase.auth.signInWithPassword({email:String(fields.get('email')).trim(),password:String(fields.get('password'))});if(error)throw error;form.reset();setOpen(false)}catch{setError(t('Sign-in failed. Check your email and password.','Не удалось войти. Проверь почту и пароль.'))}finally{setBusy(false)}
 }
 async function logout(){if(!supabase)return;setBusy(true);setError('');const{error}=await supabase.auth.signOut();if(error)setError(t('Could not sign out. Try again.','Не удалось выйти. Повтори попытку.'));setBusy(false)}
 if(!signedIn&&!ownerEntry)return null;
 return <><span className="owner-controls">{signedIn?<><span>{loading?t('Checking access…','Проверка доступа…'):canManage?t('Owner','Владелец'):t('Read only','Только просмотр')}</span><button className="text-button" disabled={busy} onClick={()=>void logout()}><LogOut size={14}/>{t('Sign out','Выйти')}</button></>:<button className="text-button" onClick={()=>{setError('');setOpen(true)}}><LockKeyhole size={14}/>{t('Owner sign in','Вход владельца')}</button>}</span>{error&&!open&&<span role="alert">{error}</span>}<Dialog open={open} onOpenChange={value=>{if(!busy)setOpen(value)}}><DialogContent className="build-dialog"><DialogTitle>{t('Owner sign in','Вход владельца')}</DialogTitle><DialogDescription>{t('Everyone can browse the archive. Only the owner can publish builds.','Просматривать архив может каждый. Публиковать билды может только владелец.')}</DialogDescription>{!supabase?<p role="alert">{t('Owner sign-in is not configured yet.','Вход владельца пока не настроен.')}</p>:<form onSubmit={login}><label>{t('Email','Почта')}<input type="email" name="email" autoComplete="username" required/></label><label>{t('Password','Пароль')}<span className="password-field"><input type={visible?'text':'password'} name="password" autoComplete="current-password" required/><button type="button" className="text-button" aria-label={visible?t('Hide password','Скрыть пароль'):t('Show password','Показать пароль')} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={19}/>:<Eye size={19}/>}</button></span></label>{error&&<p className="error" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy?t('Signing in…','Входим…'):t('Sign in','Войти')}</button></form>}</DialogContent></Dialog></>;
}
