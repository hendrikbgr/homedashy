"use client";

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileDown } from 'lucide-react';

export function HeimdallImporter() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (appsData: any[]) => {
      const res = await fetch('/api/apps/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appsData),
      });

      if (!res.ok) {
         const d = await res.json();
         throw new Error(d.error || 'Import failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      alert(`Success! Imported ${data.count} applications from Heimdall.`);
      setIsImporting(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: Error) => {
      setError(err.message);
      setIsImporting(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsedData = JSON.parse(jsonContent);
        
        if (!Array.isArray(parsedData)) {
          throw new Error('Invalid Heimdall Export format (expected JSON array)');
        }

        importMutation.mutate(parsedData);
      } catch (err: any) {
        setError(`Failed to parse file: ${err.message}`);
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file from disk');
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".json,application/json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <Button 
        variant="secondary" 
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        className="bg-white/10 hover:bg-white/20 text-white border-white/10"
      >
        {isImporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4 mr-2" />
        )}
        {isImporting ? 'Importing...' : 'Import from Heimdall'}
      </Button>

      {error && (
        <span className="text-sm text-red-400 absolute mt-12 pl-2">
          {error}
        </span>
      )}
    </div>
  );
}
