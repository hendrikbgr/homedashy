"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type App } from '@/types/app';
import { CategorySelect } from '@/components/CategorySelect';
import { Checkbox } from '@/components/ui/checkbox';

interface EditAppModalProps {
  app: App;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAppModal({ app, open, onOpenChange }: EditAppModalProps) {
  const [name, setName] = useState(app.name);
  const [url, setUrl] = useState(app.url);
  const [description, setDescription] = useState(app.description || '');
  const [category, setCategory] = useState(app.category || '');
  const [isActive, setIsActive] = useState(app.isActive);
  const [file, setFile] = useState<File | null>(null);
  
  // Distinguish if we are overriding the existing icon with an auto-fetch
  const [autoFetchIcon, setAutoFetchIcon] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scrapedIconUrl, setScrapedIconUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  const queryClient = useQueryClient();

  // Reset form when app changes or modal opens
  useEffect(() => {
    if (open) {
      setName(app.name);
      setUrl(app.url);
      setDescription(app.description || '');
      setCategory(app.category || '');
      setIsActive(app.isActive);
      setFile(null);
      setAutoFetchIcon(false);
      setScrapedIconUrl('');
    }
  }, [app, open]);

  let previewUrl = app.iconUrl || '';
  if (file) {
    previewUrl = URL.createObjectURL(file);
  } else if (autoFetchIcon && scrapedIconUrl) {
    previewUrl = scrapedIconUrl;
  }

  const editAppMutation = useMutation({
    mutationFn: async (updatedApp: any) => {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedApp),
      });

      if (!res.ok) {
        throw new Error('Failed to update app');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['status'] });
      onOpenChange(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    let finalIconUrl = app.iconUrl || '';

    // Handle Icon Upload if a new file was selected
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
          finalIconUrl = uploadData.url;
        }
      } catch (error) {
        console.error('File upload failed:', error);
      } finally {
        setIsUploading(false);
      }
    } else if (autoFetchIcon && scrapedIconUrl) {
      finalIconUrl = scrapedIconUrl;
    }

    editAppMutation.mutate({
      name,
      url: url.startsWith('http') ? url : `https://${url}`,
      description,
      category,
      iconUrl: finalIconUrl,
      isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-semibold text-primary-foreground">
            Edit Application
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor={`${app.id}-edit-name`}>App Name</Label>
            <Input
              id={`${app.id}-edit-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Proxmox"
              required
              className="bg-black/20 border-white/10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${app.id}-edit-url`}>URL</Label>
            <Input
              id={`${app.id}-edit-url`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://pve.local"
              required
              className="bg-black/20 border-white/10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${app.id}-edit-description`}>Description (optional)</Label>
            <Input
              id={`${app.id}-edit-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Main Hypervisor"
              className="bg-black/20 border-white/10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${app.id}-edit-category`}>Category (optional)</Label>
            <CategorySelect
              id={`${app.id}-edit-category`}
              value={category}
              onChange={setCategory}
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <Checkbox 
              id={`${app.id}-edit-active`} 
              checked={isActive} 
              onCheckedChange={(checked) => setIsActive(!!checked)}
              className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor={`${app.id}-edit-active`} className="text-sm font-medium cursor-pointer">
              Enable Health Monitoring
            </Label>
          </div>

          <div className="grid gap-2 mt-2">
            <Label>App Icon (Leave alone to keep current)</Label>
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
                  Force auto-fetch
                </label>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="mt-4 w-full bg-primary hover:bg-primary/80 text-primary-foreground"
            disabled={editAppMutation.isPending || isUploading || isScraping}
          >
            {editAppMutation.isPending || isUploading || isScraping ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
