"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw, Server, AlertTriangle, CheckCircle2, Globe, Power, PowerOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function OutagesPage() {
  const queryClient = useQueryClient();

  const { data: statusRes = [], isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: ['status'],
    queryFn: async () => {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Status check failed');
      return res.json();
    },
  });

  const disableServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      if (!res.ok) throw new Error('Failed to disable service');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });

  const downServices = statusRes.filter(s => !s.online);
  const upServices = statusRes.filter(s => s.online);

  const handleDisableService = (id: number, name: string) => {
    if (confirm(`Are you sure you want to disable status monitoring for "${name}"? You can re-enable it in the Manage Applications page.`)) {
      disableServiceMutation.mutate(id);
    }
  };

  return (
    <main className="min-h-screen text-foreground p-8 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <header className="flex items-center justify-between glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                Service Status
              </h1>
              <p className="text-sm text-white/60">Real-time health monitoring for your homelab</p>
            </div>
          </div>
          
          <Button 
            onClick={() => refetch()} 
            disabled={isLoading || isRefetching}
            className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Checking...' : 'Refresh Status'}
          </Button>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-panel p-6 flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <Globe className="w-6 h-6 text-white/70" />
            </div>
            <div>
              <p className="text-sm text-white/50">Monitored Services</p>
              <p className="text-2xl font-bold text-white">{statusRes.length}</p>
            </div>
          </Card>
          <Card className="glass-panel p-6 flex items-center gap-4 border-green-500/20">
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Online</p>
              <p className="text-2xl font-bold text-green-400">{upServices.length}</p>
            </div>
          </Card>
          <Card className={`glass-panel p-6 flex items-center gap-4 transition-colors ${downServices.length > 0 ? 'border-red-500/40 bg-red-500/5' : 'border-white/10'}`}>
            <div className={`p-3 rounded-xl border ${downServices.length > 0 ? 'bg-red-500/20 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
              <AlertTriangle className={`w-6 h-6 ${downServices.length > 0 ? 'text-red-400' : 'text-white/30'}`} />
            </div>
            <div>
              <p className="text-sm text-white/50">Outages</p>
              <p className={`text-2xl font-bold ${downServices.length > 0 ? 'text-red-400' : 'text-white'}`}>{downServices.length}</p>
            </div>
          </Card>
        </div>

        {/* Service List */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
          <div className="p-6 border-b border-white/10 bg-black/20 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4" />
              Monitoring List
            </h2>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Operational
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Offline
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-white/5">
            {isLoading && statusRes.length === 0 ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-6 animate-pulse flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-lg" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-white/10 rounded" />
                      <div className="w-48 h-3 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="w-20 h-6 bg-white/5 rounded-full" />
                </div>
              ))
            ) : statusRes.length === 0 ? (
              <div className="p-12 text-center text-white/40">
                No active services found to monitor.
              </div>
            ) : (
              statusRes.map((service) => (
                <div key={service.id} className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                      service.online ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{service.name}</h3>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="text-white/40 font-mono">{service.latency}ms latency</span>
                        {service.status > 0 && (
                          <span className="text-white/40">HTTP {service.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {!service.online && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisableService(service.id, service.name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs border border-red-500/20"
                      >
                        <PowerOff className="w-3.5 h-3.5 mr-2" />
                        Disable Monitoring
                      </Button>
                    )}
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${
                      service.online 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${service.online ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                      {service.online ? 'OPERATIONAL' : 'OFFLINE'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Footer info */}
        <p className="text-center text-xs text-white/30 pb-8 flex flex-col gap-1 items-center">
          <span>Status checks are performed from the server. Disabled services will not appear in this list.</span>
          <Link href="/manage" className="text-primary hover:underline">Manage all services in Settings</Link>
        </p>
      </div>
    </main>
  );
}
