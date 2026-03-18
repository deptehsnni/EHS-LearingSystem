import React from 'react';
import { BookOpen, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, title = "EHS Learning System", showNav = true }) => {
  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1C1B1F] font-sans">
      {showNav && (
        <header className="bg-white border-b border-[#E6E1E5] px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            <h1 className="text-xl font-bold tracking-tight text-[#E6A620]">EHS Learning System</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-[#49454F] hidden sm:block">
              Environment, Health, and Safety
            </div>
          </div>
        </header>
      )}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="py-8 text-center text-[#49454F] text-sm border-t border-[#E6E1E5] mt-auto">
        &copy; {new Date().getFullYear()} EHS Learning System. All rights reserved.
      </footer>
    </div>
  );
};
