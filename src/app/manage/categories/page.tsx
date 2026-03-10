"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Category } from '@/types/app';
import { ArrowLeft, Trash2, Palette } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ManageCategoriesPage() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Invalidate apps too since their UI color logic might be affected
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

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this category? (Apps assigned to it will fallback to Uncategorized visual styling until re-assigned)')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleColorChange = (id: number, newColor: string) => {
      updateCategoryColorMutation.mutate({ id, color: newColor });
  };

  return (
    <main className="min-h-screen text-foreground p-8 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <header className="flex items-center gap-6 glass-panel rounded-3xl p-6">
          <Link href="/manage">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
              Manage Categories
            </h1>
            <p className="text-sm text-white/60">Customize the colors and styling of your dashboard groups</p>
          </div>
        </header>

        <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {isLoading ? (
                <div className="col-span-full p-8 text-center text-white/50 animate-pulse">
                   Loading categories...
                </div>
             ) : categories.length === 0 ? (
                <div className="col-span-full p-8 text-center text-white/50">
                   No custom categories found. Add apps using new categories on the dashboard to populate this list.
                </div>
             ) : (
                categories.map((cat) => (
                  <div 
                    key={cat.id} 
                    className="relative bg-black/20 border border-white/10 rounded-2xl p-5 flex flex-col justify-between overflow-hidden group transition-all duration-300 hover:bg-black/40"
                    style={{
                      boxShadow: `inset 0px 4px 20px ${cat.color}15, 0 0 10px ${cat.color}10`,
                      borderColor: `${cat.color}50`
                    }}
                  >
                    {/* Background accent wash */}
                    <div 
                      className="absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
                      style={{ backgroundColor: cat.color }}
                    />
                    
                    <div className="flex justify-between items-start z-10 mb-6">
                      <h3 className="font-semibold text-lg text-white drop-shadow-sm flex items-center gap-2">
                         <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}80` }} />
                         {cat.name}
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="w-8 h-8 rounded-full text-white/40 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => handleDelete(cat.id)}
                        disabled={deleteCategoryMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-auto z-10 bg-black/30 p-2 pl-4 rounded-xl border border-white/5">
                      <span className="text-sm text-white/70 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-white/40" />
                        Accent Color
                      </span>
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/20 shadow-sm cursor-pointer group-hover:scale-105 transition-transform" style={{ backgroundColor: cat.color }}>
                        <input
                          type="color"
                          title="Change Accent Color"
                          value={cat.color.startsWith('#') ? cat.color : '#ffffff'} // Native color picker wants Hex. HSL generated usually fallback to the white default briefly until explicitly picked if browsers complain, but modern ones tolerate it or we can build a hex converter if strictly needed.
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
      </div>
    </main>
  );
}
