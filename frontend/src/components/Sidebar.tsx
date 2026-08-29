import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  Users,
  Building2,
  CheckSquare,
  CalendarDays,
  ShieldCheck,
  Briefcase,
  FileText,
  History,
  LogOut,
  UserCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define navigation items based on UserRole
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
      roles: ['ADMIN'], // Admin only queue
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
      roles: ['ADMIN', 'MANAGER'], // Admin & Manager can see team details
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
      roles: ['ADMIN'], // Admin only
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-brand-black border-r border-brand-cocoa border-opacity-40 min-h-screen flex flex-col justify-between text-gray-300">
      <div className="flex flex-col">
        {/* Logo Brand Header */}
        <div className="p-6 border-b border-brand-cocoa border-opacity-20 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-brand-dark flex items-center justify-center p-0.5 border border-brand-cocoa border-opacity-25 shadow-md">
            <img src="/logo.png" alt="CareerSync Logo" className="w-full h-full object-contain filter invert" />
          </div>
          <div>
            <h1 className="text-white font-bold tracking-wider text-sm uppercase">CareerSync</h1>
            <p className="text-[10px] text-brand-rosy font-semibold tracking-wider">PORTAL 2.0</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-cocoa text-white border-l-4 border-brand-rosy shadow-lg'
                    : 'hover:bg-brand-dark hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Staff profile badge & Logout */}
      <div className="p-4 border-t border-brand-cocoa border-opacity-30">
        <div className="flex items-center space-x-3 p-2 rounded-lg bg-brand-dark bg-opacity-40 mb-3">
          <div className="w-10 h-10 rounded-full bg-brand-cocoa flex items-center justify-center text-white font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">{user.name}</h2>
            <p className="text-[10px] text-brand-rosy uppercase font-semibold tracking-wider truncate">
              {user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-brand-card hover:bg-red-950 hover:text-red-200 hover:border-red-800 border border-brand-cocoa border-opacity-30 text-gray-300 rounded-lg text-sm font-medium transition-all duration-300 shadow-md"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
};
