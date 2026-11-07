import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F8F1] flex text-[#1B2F1C]">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto bg-[#F8F8F1]">
        <Outlet />
      </main>
    </div>
  );
};
