'use client';

import IdPasswordRecoveryForm from '@/components/auth/IdPasswordRecoveryForm';
import './page.css';

export default function PCResetPasswordPage() {
  return <IdPasswordRecoveryForm mode="PASSWORD" device="pc" />;
}
