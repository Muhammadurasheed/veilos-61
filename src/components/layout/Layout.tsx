
import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  hideSidebar?: boolean;
  hideHeader?: boolean;
  className?: string;
}

const Layout = ({
  children,
  hideFooter,
  hideSidebar,
  hideHeader,
  className,
}: LayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      {!hideSidebar && <Sidebar />}
      <div className={cn(
        "flex flex-col min-h-screen w-full transition-all duration-300",
        !hideSidebar && (isMobile ? "ml-0" : "ml-16 md:ml-64"),
      )}>
        {!hideHeader && <Header />}
        <main className={cn("flex-grow", className)}>{children}</main>
        {!hideFooter && <Footer />}
      </div>
    </div>
  );
};

export default Layout;
