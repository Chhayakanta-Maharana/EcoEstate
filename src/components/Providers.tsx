'use client';

import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { FloatingAiCopilotButton } from '@/components/FloatingAiCopilotButton';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <FloatingAiCopilotButton />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default Providers;
