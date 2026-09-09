import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 bg-cyber-grid relative overflow-x-hidden">
      {/* Ambient Futuristic Glow Orbs */}
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-0 left-1/3 w-96 h-96 bg-navy-800/5 rounded-full blur-3xl pointer-events-none z-0" />

      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <div className="flex-1 flex flex-col min-w-0 z-10">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto animate-fade-in-scale">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
