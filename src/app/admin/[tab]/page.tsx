'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SuperAdminPortal from '@/components/SuperAdminPortal';

export default function AdminTabPage() {
  const router = useRouter();
  const params = useParams();
  const { currentUser } = useAuth();

  const tabParam = (params?.tab as string) || 'dashboard';
  const validTabs: Array<'dashboard' | 'users' | 'facilities' | 'settings'> = [
    'dashboard',
    'users',
    'facilities',
    'settings',
  ];

  const currentTab = validTabs.includes(tabParam as any)
    ? (tabParam as 'dashboard' | 'users' | 'facilities' | 'settings')
    : 'dashboard';

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <span className="inline-block w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SuperAdminPortal
      initialTab={currentTab}
      onNavigateTab={(tab) => {
        router.push(`/admin/${tab}`);
      }}
      onNavigateToOrg={(orgId) => {
        router.push(`/user/${orgId}`);
      }}
    />
  );
}
