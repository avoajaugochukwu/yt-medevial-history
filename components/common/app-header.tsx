"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { path: '/scripting', label: 'Scripting' },
    { path: '/scenes', label: 'Scenes' },
    { path: '/export', label: 'Export' },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => router.push('/scripting')}
              >
                <Sparkles className="h-6 w-6 text-red-800" />
                <h1 className="text-xl font-bold text-gray-900">
                  Historia
                </h1>
                <span className="text-sm text-gray-500">v2.0</span>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(item.path)}
                    className={cn(
                      "text-sm",
                      pathname === item.path
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    {item.label}
                  </Button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600 hidden lg:block">
                AI-Powered Historical Narratives
              </p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
