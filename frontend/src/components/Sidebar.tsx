import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  LogOut,
  UserCheck,
  X,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate('/login');
  };

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
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between text-slate-700 shadow-sm">
      <div className="flex flex-col">
        {/* Rathinam College RGU Logo Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-800 to-red-950 flex items-center justify-center text-white p-1.5 shadow-md border border-red-900/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-extrabold text-red-900 tracking-wider text-base uppercase leading-none">RATHINAM</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">GROUP OF INSTITUTIONS</p>
              <span className="inline-block mt-0.5 text-[9px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded font-extrabold tracking-wide uppercase">
                CAREERSYNC RGU
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-red-800 text-white shadow-md shadow-red-900/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-red-900'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-3 p-2 rounded-xl bg-white border border-slate-200 mb-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-red-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-bold text-slate-800 truncate">{user.name}</h2>
            <p className="text-[10px] text-red-700 uppercase font-extrabold tracking-wider truncate">
              {user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-white hover:bg-red-50 text-slate-700 hover:text-red-800 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-semibold transition-all duration-200 shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
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
