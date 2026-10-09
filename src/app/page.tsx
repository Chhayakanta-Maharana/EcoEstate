'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/components/LoginPage';

export default function Home() {
  const router = useRouter();
  const { currentUser, isSuperAdmin, activeOrg } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (isSuperAdmin) {
      router.push('/admin/dashboard');
    } else {
      const targetOrg = currentUser.organizationId || activeOrg?.id || 'org-bput';
      router.push(`/user/${targetOrg}`);
    }
  }, [currentUser, isSuperAdmin, activeOrg, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading EcoEstate INDIA...</p>
      </div>
    </div>
  );
}
