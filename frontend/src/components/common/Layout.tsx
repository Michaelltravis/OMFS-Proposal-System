/**
 * Main Layout Component with Navigation
 */
import { Outlet, NavLink } from 'react-router-dom';
import { FileText, Folder } from 'lucide-react';

export const Layout = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-100 text-primary-700 font-medium'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">
                Proposal System
              </h1>
              <nav className="flex gap-2">
                <NavLink to="/repository" className={navLinkClass}>
                  <Folder className="w-4 h-4" />
                  Content Library
                </NavLink>
                <NavLink to="/proposals/1" className={navLinkClass}>
                  <FileText className="w-4 h-4" />
                  Proposal Builder
                </NavLink>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-73px)]">
        <Outlet />
      </main>
    </div>
  );
};
