'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  FileSpreadsheet, 
  ShieldCheck,
  Scan
} from 'lucide-react';

interface SidebarProps {
  userRole?: 'FACULTY' | 'ADMIN';
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [effectiveRole, setEffectiveRole] = useState<'FACULTY' | 'ADMIN'>(userRole || 'FACULTY');

  useEffect(() => {
    if (userRole) {
      setEffectiveRole(userRole);
      return;
    }
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user?.role) {
          setEffectiveRole(data.user.role);
        }
      })
      .catch(() => {});
  }, [userRole, pathname]);

  if (pathname === '/' || pathname === '/checkin') {
    return null;
  }

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      title: 'Classroom Door Kiosk',
      href: '/terminal',
      icon: Scan,
      badge: 'Edge AI',
    },
    {
      title: 'Timetable Matrix',
      href: '/timetable',
      icon: CalendarDays,
      badge: 'Schedule',
    },
    {
      title: 'Faculty Delegation',
      href: '/delegation',
      icon: Users,
      badge: null,
    },
    {
      title: 'Student Attendance Reports',
      href: '/reports',
      icon: FileSpreadsheet,
      badge: null, // "75% AUDIT" box removed per user requirement
    },
  ];

  if (effectiveRole === 'ADMIN') {
    navItems.push({
      title: 'Dean Admin Console',
      href: '/admin',
      icon: ShieldCheck,
      badge: 'Office',
    });
  }

  return (
    <>
      {/* Desktop Sidebar (md and above) */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-4 transition-colors text-zinc-900 dark:text-zinc-100 shadow-xs">
        <div className="space-y-6">
          <div>
            <p className="px-3 text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Academic Operations
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all group ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black font-bold shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 transition-colors ${
                        isActive 
                          ? 'text-white dark:text-black' 
                          : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
                      }`} />
                      <span className="truncate">{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider ${
                        isActive 
                          ? 'bg-zinc-700 text-white dark:bg-zinc-200 dark:text-black' 
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-3 py-2 text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between font-mono">
          <span>SmartCampus v2.0</span>
          <span>ISO-9001</span>
        </div>
      </aside>

      {/* Mobile Sticky Navigation (< md) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive 
                  ? 'text-zinc-900 dark:text-white font-bold' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-xs' 
                  : 'bg-transparent text-current'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[62px]">
                {item.title.replace('Dean Admin Console', 'Admin').replace('Student Attendance Reports', 'Reports').replace('Faculty Delegation', 'Delegation').replace('Timetable Matrix', 'Timetable')}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
