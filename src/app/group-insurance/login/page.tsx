 'use client';
 
 import { useEffect, useState } from 'react';
 import { isMobileDevice } from '@/utils/device';
 import MobileGroupInsuranceLoginPage from './m/page';
 import PCGroupInsuranceLoginPage from './pc/page';
 
 export default function GroupInsuranceLoginPage() {
   const [isMobile, setIsMobile] = useState(false);
 
   useEffect(() => {
     setIsMobile(isMobileDevice());
   }, []);
 
   if (isMobile) {
     return <MobileGroupInsuranceLoginPage />;
   }
 
   return <PCGroupInsuranceLoginPage />;
 }
