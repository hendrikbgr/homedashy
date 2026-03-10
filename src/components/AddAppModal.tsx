"use client";

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { CategorySelect } from '@/components/CategorySelect';

export function AddAppModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [autoFetchIcon, setAutoFetchIcon] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scrapedIconUrl, setScrapedIconUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  // Determine preview URL
  let previewUrl = '';
  if (file) {
    previewUrl = URL.createObjectURL(file);
  } else if (autoFetchIcon && scrapedIconUrl) {
    previewUrl = scrapedIconUrl;
  }

  const queryClient = useQueryClient();

  const createAppMutation = useMutation({
    mutationFn: async (newApp: any) => {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newApp),
      });

      if (!res.ok) {
        throw new Error('Failed to create app');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      setOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setName('');
    setUrl('');
    setDescription('');
    setCategory('');
    setFile(null);
    setAutoFetchIcon(false);
    setScrapedIconUrl('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    let iconUrl = '';

    // Handle Icon Upload
    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        
        if (uploadRes.ok) {
          iconUrl = uploadData.url;
        }
      } catch (error) {
        console.error('File upload failed:', error);
      } finally {
        setIsUploading(false);
      }
    } else if (autoFetchIcon && scrapedIconUrl) {
      iconUrl = scrapedIconUrl;
    }

    createAppMutation.mutate({
      name,
      url: url.startsWith('http') ? url : `https://${url}`,
      description,
      category,
      iconUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={<Button className="glass-panel glass-panel-hover" variant="outline" />}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Application
      </DialogTrigger>
      <DialogContent className="glass-panel text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-semibold text-primary-foreground">
            Add New Application
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">App Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Proxmox"
              required
              className="bg-black/20 border-white/10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://pve.local"
              required
              className="bg-black/20 border-white/10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Main Hypervisor"
              className="bg-black/20 border-white/10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category (optional)</Label>
            <CategorySelect
              id="category"
              value={category}
              onChange={setCategory}
            />
          </div>

          <div className="grid gap-2 mt-2">
            <Label>App Icon</Label>
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 shrink-0 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                {isScraping ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                ) : previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className={`w-full h-full object-contain p-2 ${previewUrl.toLowerCase().endsWith('.png') ? '' : 'rounded-lg'}`} 
                  />
                ) : (
                  <span className="text-xs text-white/40 text-center px-1">No Icon</span>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-3 flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={autoFetchIcon}
                  className="bg-black/20 border-white/10 text-xs py-1.5"
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={autoFetchIcon}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      setAutoFetchIcon(checked);
                      if (checked) {
                        setFile(null);
                        if (url) {
                          setIsScraping(true);
                          try {
                            const res = await fetch(`/api/fetch-icon?url=${encodeURIComponent(url)}`);
                            if (res.ok) {
                              const data = await res.json();
                              setScrapedIconUrl(data.url);
                            }
                          } catch (err) {
                            console.error('Failed to scrape icon', err);
                          } finally {
                            setIsScraping(false);
                          }
                        }
                      } else {
                        setScrapedIconUrl('');
                      }
                    }}
                    disabled={!!file || !url || isScraping}
                    className="rounded border-white/20 bg-black/20"
                  />
                  Auto-fetch favicon from URL
                </label>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="mt-4 w-full bg-primary hover:bg-primary/80 text-primary-foreground"
            disabled={createAppMutation.isPending || isUploading || isScraping}
          >
            {createAppMutation.isPending || isUploading || isScraping ? 'Saving...' : 'Add Application'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
