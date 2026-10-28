import type { Metadata } from 'next';
import './globals.css';
import '../../public/css/all.css';
import localFont from 'next/font/local';
const inter=localFont({src:'../../public/fonts/inter.ttf',weight:'100 900',variable:'--font-inter',display:'swap'});
const devanagari=localFont({src:'../../public/fonts/noto-sans-devanagari.ttf',weight:'100 900',variable:'--font-devanagari',display:'swap',preload:false});
import { ToastHost } from '@/components/toast-host';
export const metadata:Metadata={
  title:{default:'Royal Gates | मजबूती भी, खूबसूरती भी।',template:'%s | Royal Gates'},
  description:'Royal Gates - Welding & Fabrication Works. Custom gates, grills, railings, windows, doors, sheds. मजबूती भी, खूबसूरती भी। Explore designs and request a measured quotation.'
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={inter.variable+' '+devanagari.variable}><body>{children}<ToastHost/></body></html>;}
