'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/components/LoginPage';

export default function Home() {
  const router = useRouter();
  const { currentUser, isAuthReady, isSuperAdmin, activeOrg } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthReady && currentUser) {
      if (isSuperAdmin) {
        router.push('/admin/dashboard');
      } else {
        const targetOrg = currentUser.organizationId || activeOrg?.id || 'org-bput';
        router.push(`/user/${targetOrg}`);
      }
    }
  }, [mounted, isAuthReady, currentUser, isSuperAdmin, activeOrg, router]);

  // Initial SSR & first client hydration pass: render identical loading shell
  if (!mounted || !isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020305] text-white" suppressHydrationWarning>
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading EcoEstate...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated once mounted, show redirect spinner
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

  // If not authenticated, render LoginPage
  return <LoginPage />;
}

