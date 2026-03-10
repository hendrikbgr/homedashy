"use client";

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Category } from '@/types/app';
import { Input } from '@/components/ui/input';
import { X, ChevronDown } from 'lucide-react';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function CategorySelect({ value, onChange, id }: CategorySelectProps) {
  const [isTypingNew, setIsTypingNew] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);
  const queryClient = useQueryClient();

  // Fetch actual categories from database
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  const generateCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        throw new Error('Failed to create category');
      }
      return res.json();
    },
    onSuccess: (newCat: Category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsTypingNew(false);
      onChange(newCat.name);
    }
  });

  // Extract unique category names specifically for local array operations
  const uniqueCategories = [
    'Uncategorized',
    ...categories.map(c => c.name).filter(n => n !== 'Uncategorized').sort((a,b) => a.localeCompare(b))
  ];

  // Effect to handle if the incoming value is not in our known list
  // which might happen if editing an app with a unique/stale category label.
  useEffect(() => {
    if (value && value !== '' && !uniqueCategories.includes(value) && !isTypingNew) {
      setIsTypingNew(true);
    }
  }, [value, uniqueCategories, isTypingNew]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__CREATE_NEW__') {
      setIsTypingNew(true);
      onChange(''); // clear value so they can type fresh
    } else {
      onChange(selected);
    }
  };

  if (isTypingNew) {
    return (
      <div className="relative flex items-center w-full gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="New Category Name..."
          className="bg-black/20 border-white/10 flex-1 focus-visible:ring-primary/50"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (value.trim() !== '') {
                generateCategoryMutation.mutate(value.trim());
              }
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (value.trim() !== '') {
               generateCategoryMutation.mutate(value.trim());
            } else {
               setIsTypingNew(false);
               onChange('Uncategorized');
            }
          }}
          disabled={generateCategoryMutation.isPending}
          className="px-3 py-2 bg-primary/20 hover:bg-primary/40 text-primary rounded-md transition-colors text-sm whitespace-nowrap"
        >
          {generateCategoryMutation.isPending ? 'Saving...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsTypingNew(false);
            onChange('Uncategorized'); // fallback
          }}
          className="p-2 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          title="Cancel creating new category"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <select
        id={id}
        value={value || 'Uncategorized'}
        onChange={handleSelectChange}
        ref={selectRef}
        className="flex h-9 w-full items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-white cursor-pointer"
      >
        {uniqueCategories.map((catName) => {
           // Attempt to find physical category to extract its color for styling the option slightly
           const CatObj = categories.find(c => c.name === catName);
           return (
             <option 
               key={catName} 
               value={catName} 
               className="bg-zinc-800 text-white" 
               style={{ borderLeft: CatObj ? `4px solid ${CatObj.color}` : 'none' }}
             >
               {catName}
             </option>
           );
        })}
        <option disabled className="bg-zinc-800 text-white/50">──────────</option>
        <option value="__CREATE_NEW__" className="bg-zinc-800 text-primary font-medium">
          + Create New Category
        </option>
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
    </div>
  );
}
