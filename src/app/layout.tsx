import type { Metadata } from 'next';
import './globals.css';
import { ToastHost } from '@/components/toast-host';
export const metadata:Metadata={title:{default:'SmartFabrication | Built for your space',template:'%s | SmartFabrication'},description:'Custom gates, grills, railings and steel fabrication. Explore designs and request a measured quotation.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<ToastHost/></body></html>;}
