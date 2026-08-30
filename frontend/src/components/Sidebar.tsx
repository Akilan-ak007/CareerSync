import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  Users,
  Building2,
  CheckSquare,
  CalendarDays,
  Briefcase,
  FileText,
  History,
  UserCheck,
  X,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  if (!user) return null;

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER', 'PLACEMENT_TEAM'],
    },
    {
      label: 'Students',
      path: '/students',
      icon: Users,
      roles: ['ADMIN', 'MANAGER', 'PLACEMENT_TEAM'],
    },
    {
      label: 'Companies',
      path: '/companies',
      icon: Building2,
      roles: ['ADMIN', 'MANAGER', 'PLACEMENT_TEAM'],
    },
    {
      label: 'Company Approvals',
      path: '/company-approvals',
      icon: CheckSquare,
      roles: ['ADMIN'],
    },
    {
      label: 'Placement Drives',
      path: '/drives',
      icon: CalendarDays,
      roles: ['ADMIN', 'MANAGER', 'PLACEMENT_TEAM'],
    },
    {
      label: 'Placement Team',
      path: '/team',
      icon: UserCheck,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      label: 'Offers Tracking',
      path: '/offers',
      icon: Briefcase,
      roles: ['ADMIN', 'MANAGER', 'PLACEMENT_TEAM'],
    },
    {
      label: 'Reports Generator',
      path: '/reports',
      icon: FileText,
      roles: ['ADMIN', 'MANAGER', 'PLACEMENT_TEAM'],
    },
    {
      label: 'Audit Logs',
      path: '/audit-logs',
      icon: History,
      roles: ['ADMIN'],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(user.role));

  const sidebarContent = (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between text-slate-700 shadow-lg transition-all duration-300 ease-in-out group z-40 ${
        isHovered ? 'w-64' : 'w-16 md:w-20'
      }`}
    >
      <div className="flex flex-col">
        {/* Rathinam RGU Logo Header */}
        <div className="p-3 md:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 overflow-hidden h-16">
          <div className="flex items-center space-x-3 min-w-max">
            <div className="w-10 h-10 rounded-xl bg-purple-900 text-white flex items-center justify-center font-black shrink-0 shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            
            <div className={`flex flex-col space-y-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 hidden'}`}>
              <img 
                src="/rgu-banner-logo.png" 
                alt="Rathinam Global University" 
                className="h-7 max-w-[160px] object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <div className="flex items-center space-x-1 text-[9px] font-mono font-bold">
                <span className="bg-purple-100 text-purple-800 px-1 rounded uppercase">RGU CAREERSYNC</span>
                <span className="bg-emerald-100 text-emerald-800 px-1 rounded uppercase">A++</span>
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-2 md:p-3 space-y-1.5 flex-1 overflow-x-hidden">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center space-x-3.5 px-3 py-3 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-900 text-white shadow-md shadow-purple-950/20 font-bold'
                    : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 hidden'}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Info Pill when expanded */}
      <div className={`p-3 border-t border-slate-100 bg-slate-50/80 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 hidden'}`}>
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
          <span>RGU PORTAL v2.5</span>
          <span className="text-emerald-700">ONLINE</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Collapsible Floating Sidebar */}
      <div className="hidden md:flex flex-shrink-0 relative z-30">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 animate-fade-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
