'use client';

import IdPasswordRecoveryForm from '@/components/auth/IdPasswordRecoveryForm';
import './page.css';

export default function PCFindIdPage() {
  return <IdPasswordRecoveryForm mode="ID" device="pc" />;
}
