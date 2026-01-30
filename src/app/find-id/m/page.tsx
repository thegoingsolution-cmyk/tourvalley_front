'use client';

import IdPasswordRecoveryForm from '@/components/auth/IdPasswordRecoveryForm';
import './page.css';

export default function MobileFindIdPage() {
  return <IdPasswordRecoveryForm mode="ID" device="m" />;
}
