"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type App, type Category } from '@/types/app';
import { EditAppModal } from '@/components/EditAppModal';
import { JsonImporter } from '@/components/JsonImporter';
import { ArrowLeft, Pencil, Trash2, Download, LayoutGrid, Tags, Palette, Globe, ExternalLink } from 'lucide-react';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UnifiedManagePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'apps' | 'categories'>('apps');
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: apps = [], isLoading: appsLoading } = useQuery<App[]>({
    queryKey: ['apps'],
    queryFn: async () => {
      const res = await fetch('/api/apps');
      if (!res.ok) throw new Error('Failed to fetch apps');
      return res.json();
    },
  });

  const { data: categories = [], isLoading: catsLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  // App Mutations
  const deleteAppMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/apps/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete app');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['status'] });
    },
  });

  // Category Mutations
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });

  const updateCategoryColorMutation = useMutation({
    mutationFn: async ({ id, color }: { id: number; color: string }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color })
      });
      if (!res.ok) throw new Error('Failed to update category color');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    }
  });

  const handleDeleteApp = (id: number) => {
    if (confirm('Are you sure you want to permanently delete this application?')) {
      deleteAppMutation.mutate(id);
    }
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm('Delete this category? Apps will revert to default styling until re-assigned.')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleExport = () => {
    const appsToExport = apps.map(({ id, createdAt, categoryColor, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(appsToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'homedashy-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function handleColorChange(id: number, newColor: string) {
    updateCategoryColorMutation.mutate({ id, color: newColor });
  }

  return (
    <main className="min-h-screen text-foreground p-8 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <header className="glass-panel rounded-3xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <div className="flex items-center gap-6">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-white shadow-inner">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                  Dashboard Settings
                </h1>
                <p className="text-sm text-white/60 font-medium">Configure your homelab experience</p>
              </div>
            </div>

            <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md self-start md:self-center">
              <button 
                onClick={() => setActiveTab('apps')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm ${
                  activeTab === 'apps' 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Applications
              </button>
              <button 
                onClick={() => setActiveTab('categories')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm ${
                  activeTab === 'categories' 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Tags className="w-4 h-4" />
                Categories
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <JsonImporter />
               <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl h-11" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Config
              </Button>
            </div>
          </div>
        </header>

        {activeTab === 'apps' ? (
          <div className="space-y-4">
            {appsLoading ? (
              <div className="p-12 text-center glass-panel rounded-3xl animate-pulse text-white/40">
                Loading applications...
              </div>
            ) : apps.length === 0 ? (
              <div className="p-12 text-center glass-panel rounded-3xl border border-white/10 text-white/50">
                No applications found. Add some from the dashboard!
              </div>
            ) : (
              <div className="grid gap-3">
                {apps.map((app) => (
                  <div key={app.id} className="glass-panel group p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-6 hover:bg-white/[0.03] transition-all relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: app.categoryColor || 'currentColor' }} />
                    
                    {/* App Icon */}
                    <div className="w-14 h-14 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                      {app.iconUrl ? (
                        <img src={app.iconUrl} alt={app.name} className={`w-full h-full object-contain p-2 ${app.iconUrl.toLowerCase().endsWith('.png') ? '' : 'rounded-lg'}`} />
                      ) : (
                        <span className="text-xl font-bold uppercase text-white/40">{app.name.substring(0, 2)}</span>
                      )}
                    </div>

                    {/* App Core Info */}
                    <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h3 className="text-lg font-bold text-white tracking-tight">{app.name}</h3>
                        {app.category && (
                          <span className="bg-white/10 text-white/60 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/5 font-semibold">
                            {app.category}
                          </span>
                        )}
                        {!app.isActive && (
                          <span className="bg-red-500/10 text-red-400 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-red-500/20 font-semibold">
                            Monitoring Disabled
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-3 text-sm">
                        <a href={app.url} target="_blank" className="text-primary/70 hover:text-primary flex items-center gap-1.5 transition-colors max-w-xs truncate">
                          <Globe className="w-3.5 h-3.5" />
                          {app.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {app.description && (
                        <p className="text-xs text-white/40 line-clamp-1 italic">{app.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-white/5 hover:bg-white/10 text-white border-white/10 h-10 px-4 rounded-xl transition-all"
                        onClick={() => setEditingApp(app)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        className="bg-red-500/10 hover:bg-red-500/80 text-red-400 hover:text-white border border-red-500/20 transition-all h-10 w-10 rounded-xl"
                        onClick={() => handleDeleteApp(app.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl border border-white/10 p-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {catsLoading ? (
                  <div className="col-span-full p-8 text-center text-white/50 animate-pulse">
                     Loading categories...
                  </div>
               ) : categories.length === 0 ? (
                  <div className="col-span-full p-12 text-center text-white/50 flex flex-col items-center gap-4">
                     <p>No custom categories found.</p>
                     <p className="text-xs">Add applications with new category names on your dashboard to see them appear here.</p>
                  </div>
               ) : (
                  categories.map((cat) => (
                    <div 
                      key={cat.id} 
                      className="relative bg-black/40 border border-white/10 rounded-[2rem] p-6 flex flex-col justify-between overflow-hidden group transition-all duration-500 hover:bg-black/60 shadow-xl"
                      style={{
                        boxShadow: `inset 0px 4px 40px ${cat.color}15, 0 8px 32px rgba(0,0,0,0.4)`,
                        borderColor: `color-mix(in srgb, ${cat.color} 40%, white 10%)`
                      }}
                    >
                      {/* Background accent wash */}
                      <div 
                        className="absolute -top-10 -right-10 w-48 h-48 blur-[60px] opacity-10 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"
                        style={{ backgroundColor: cat.color }}
                      />
                      
                      <div className="flex justify-between items-start z-10 mb-8">
                        <div>
                          <h3 className="font-bold text-xl text-white drop-shadow-md flex items-center gap-3">
                             {cat.name}
                          </h3>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-10 h-10 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/10 border border-white/5"
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={deleteCategoryMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-auto z-10 bg-black/40 p-3 rounded-2xl border border-white/10">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                          <Palette className="w-3.5 h-3.5" />
                          Category Hue
                        </span>
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20 shadow-lg cursor-pointer group-hover:scale-110 transition-transform" style={{ backgroundColor: cat.color }}>
                          <input
                            type="color"
                            title="Change Accent Color"
                            value={cat.color.startsWith('#') ? cat.color : '#ffffff'}
                            onChange={(e) => handleColorChange(cat.id, e.target.value)}
                            className="absolute inset-0 w-[200%] h-[200%] -top-[50%] -left-[50%] opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ))
               )}
             </div>
          </div>
        )}
      </div>

      {editingApp && (
        <EditAppModal 
          app={editingApp} 
          open={!!editingApp} 
          onOpenChange={(open) => !open && setEditingApp(null)} 
        />
      )}
    </main>
  );
}
