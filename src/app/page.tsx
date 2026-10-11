'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/components/LoginPage';

export default function Home() {
  const router = useRouter();
  const { currentUser, isSuperAdmin, activeOrg } = useAuth();

  useEffect(() => {
    if (currentUser) {
      if (isSuperAdmin) {
        router.push('/admin/dashboard');
      } else {
        const targetOrg = currentUser.organizationId || activeOrg?.id || 'org-bput';
        router.push(`/user/${targetOrg}`);
      }
    }
  }, [currentUser, isSuperAdmin, activeOrg, router]);

  // If user is already authenticated, show the dark loading spinner while redirecting to dashboard
  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020305] text-white">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Opening Dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, render LoginPage directly without any delay or unstyled screen
  return <LoginPage />;
}
