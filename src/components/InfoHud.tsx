"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { type App } from '@/types/app';
import { Server, Activity, CalendarDays, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function InfoHud() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  // Set mounted to true on client-side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch apps for stats overview
  const { data: apps = [] } = useQuery<App[]>({
    queryKey: ['apps'],
    // We don't need a queryFn here if it's already defined elsewhere as a default 
    // but better safe to provide it or ensure it defaults.
    queryFn: async () => {
      const res = await fetch('/api/apps');
      return res.json();
    }
  });

  const { data: statusRes = [], isLoading: isStatusLoading } = useQuery<any[]>({
    queryKey: ['status'],
    queryFn: async () => {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Status check failed');
      return res.json();
    },
    refetchInterval: 60000,
  });

  const downServices = statusRes.filter(s => !s.online);
  const totalDownCount = downServices.length;
  const isAllUp = statusRes.length > 0 && totalDownCount === 0;

  const timeString = mounted ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';
  const dateString = mounted ? time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : 'Loading date...';

  const hour = time.getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Time & Greeting Panel */}
      <Card className="glass-panel col-span-1 md:col-span-2 flex items-center justify-between p-6 relative overflow-hidden">
        <div className="z-10 bg-gradient-to-r from-primary/20 via-transparent to-transparent absolute inset-0 pointer-events-none" />
        <div className="z-20 relative">
          <h2 className="text-2xl font-bold text-white drop-shadow-md mb-1">{mounted ? `${greeting}, Homelabber` : 'Welcome'}</h2>
          <div className="flex items-center text-white/70 text-sm">
            <CalendarDays className="w-4 h-4 mr-2" />
            {dateString}
          </div>
        </div>
        <div className="z-20 relative text-right">
          <div className="text-4xl font-light tabular-nums font-mono text-white drop-shadow-lg tracking-tight">
            {timeString}
          </div>
        </div>
      </Card>

      {/* Services Stat */}
      <Card className="glass-panel flex flex-col justify-center p-6 relative overflow-hidden group">
        <div className="flex items-center justify-between z-20">
          <div>
            <p className="text-sm text-white/60 mb-1">Tracked Services</p>
            <p className="text-3xl font-bold text-white group-hover:text-primary transition-colors">
              {apps.length}
            </p>
          </div>
          <div className="p-3 bg-primary/20 rounded-xl text-primary border border-primary/30 shadow-inner">
            <Server className="w-6 h-6" />
          </div>
        </div>
      </Card>

      {/* Network Status Stat */}
      <Link href="/outages" className="block h-full">
        <Card className="glass-panel flex flex-col justify-center p-6 relative overflow-hidden group h-full transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <div className="flex items-center justify-between z-20">
            <div>
              <p className="text-sm text-white/60 mb-1">Network Status</p>
              <div className="flex items-center gap-2">
                {isStatusLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white/20 rounded-full animate-pulse" />
                    <p className="text-xl font-bold text-white/40">Checking...</p>
                  </div>
                ) : isAllUp ? (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <p className="text-xl font-bold text-green-400 group-hover:text-green-300 transition-colors">
                      Operational
                    </p>
                  </div>
                ) : totalDownCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <p className="text-xl font-bold text-red-400 group-hover:text-red-300 transition-colors">
                      {totalDownCount} Service{totalDownCount > 1 ? 's' : ''} Down
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white/40 rounded-full" />
                    <p className="text-xl font-bold text-white/60">Unknown</p>
                  </div>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-xl border shadow-inner transition-colors flex items-center gap-2 ${
              isAllUp ? "bg-green-500/20 text-green-400 border-green-500/30" : 
              totalDownCount > 0 ? "bg-red-500/20 text-red-400 border-red-500/30" : 
              "bg-white/5 text-white/40 border-white/10"
            }`}>
              <Activity className="w-6 h-6" />
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
