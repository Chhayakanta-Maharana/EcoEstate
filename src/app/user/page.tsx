'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import EstateWorkspace from '@/components/EstateWorkspace';

export default function UserPage() {
  const router = useRouter();
  const { currentUser, isAuthReady, activeOrg } = useAuth();

  useEffect(() => {
    if (isAuthReady && !currentUser) {
      router.push('/login');
    } else if (activeOrg?.id) {
      router.replace(`/user/${activeOrg.id}`);
    }
  }, [isAuthReady, currentUser, activeOrg, router]);

  if (!isAuthReady || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <span className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <EstateWorkspace orgId={activeOrg?.id} />;
}
