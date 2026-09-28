import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ArchiveApp} from '@/components/archive/ArchiveApp';
import '@/app/globals.css';
createRoot(document.getElementById('root')!).render(<StrictMode><ArchiveApp/></StrictMode>);
