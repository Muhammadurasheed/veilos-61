import React from 'react';

interface SmartRouterProps {
  children: React.ReactNode;
}

export const SmartRouter: React.FC<SmartRouterProps> = ({ children }) => {
  // Simply render children - no onboarding logic needed
  return <>{children}</>;
};