import type { Metadata } from 'next';
import './globals.css';
import { ToastHost } from '@/components/toast-host';
export const metadata:Metadata={
  title:{default:'GateWala | मजबूती भी, खूबसूरती भी।',template:'%s | GateWala'},
  description:'GateWala - Welding & Fabrication Works. Custom gates, grills, railings, windows, doors, sheds. मजबूती भी, खूबसूरती भी। Explore designs and request a measured quotation.'
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<ToastHost/></body></html>;}
