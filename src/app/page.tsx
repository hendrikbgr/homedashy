"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppCard } from '@/components/AppCard';
import { AddAppModal } from '@/components/AddAppModal';
import { InfoHud } from '@/components/InfoHud';
import { type App } from '@/types/app';
import { Search, LayoutDashboard, Settings } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function Home() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: apps = [], isLoading } = useQuery<App[]>({
    queryKey: ['apps'],
    queryFn: async () => {
      const res = await fetch('/api/apps');
      if (!res.ok) throw new Error('Failed to fetch apps');
      return res.json();
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/apps/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete app');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });

  const filteredApps = apps.filter((app) => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group apps by category
  const groupedApps = filteredApps.reduce((acc, app) => {
    const defaultCat = 'Uncategorized';
    const category = app.category && app.category.trim() !== '' ? app.category : defaultCat;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(app);
    return acc;
  }, {} as Record<string, App[]>);

  // Sort categories alphabetically (Uncategorized always last)
  const sortedCategories = Object.keys(groupedApps).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  return (
    <main className="min-h-screen text-foreground p-8 relative overflow-hidden">
      {/* Decorative Orbs for deeper glass immersion */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/30 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary/30 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
              <LayoutDashboard className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                Homedashy
              </h1>
              <p className="text-sm text-white/60">Your personal homelab central</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 md:max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/40 h-12 rounded-xl focus-visible:ring-primary/50 transition-all shadow-inner"
              />
            </div>
            <AddAppModal />
            <Link href="/manage">
              <div className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-white/10">
                <Settings className="w-5 h-5 text-white/70 hover:text-white" />
              </div>
            </Link>
          </div>
        </header>

        {/* HUD Component */}
        <InfoHud />

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="glass-panel h-40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : sortedCategories.length > 0 ? (
          <div className="space-y-12">
            {sortedCategories.map((category) => (
              <section key={category} className="space-y-4">
                <div className="flex items-center gap-3 relative before:absolute before:inset-y-1/2 before:-z-10 before:w-full before:border-b before:border-white/10">
                  {(() => {
                    const groupColor = groupedApps[category][0]?.categoryColor || 'var(--primary)';
                    return (
                      <span 
                        className="bg-background/80 backdrop-blur-md px-4 py-1.5 rounded-full border text-sm font-medium text-white shadow-lg inline-flex items-center gap-2"
                        style={{ borderColor: `color-mix(in srgb, ${groupColor}, transparent 60%)` }}
                      >
                        <div 
                          className="w-2 h-2 rounded-full animate-pulse" 
                          style={{ backgroundColor: groupColor, boxShadow: `0 0 8px ${groupColor}` }}
                        />
                        {category}
                        <span className="bg-white/10 text-white/70 px-1.5 py-0.5 rounded-full text-xs ml-1">
                          {groupedApps[category].length}
                        </span>
                      </span>
                    );
                  })()}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6 auto-rows-fr">
                  {groupedApps[category].map((app) => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-3xl min-h-[40vh] border border-white/10 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-inner mb-4">
              <Search className="w-8 h-8 text-white/40" />
            </div>
            <h2 className="text-xl font-semibold text-white/90">No applications found</h2>
            <p className="text-sm text-white/50 max-w-md">
              {searchQuery 
                ? "No apps matched your search query. Try adjusting your vocabulary." 
                : "Your dashboard is looking a little empty. Add your first application to get started!"}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
