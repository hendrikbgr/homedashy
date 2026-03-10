import { AlertCircle, PowerOff } from 'lucide-react';
import { type App } from '@/types/app';
import { useQuery } from '@tanstack/react-query';

interface AppCardProps {
  app: App;
}

export function AppCard({ app }: AppCardProps) {
  const accentColor = app.categoryColor || '#ffffff';
  
  const { data: statusRes = [] } = useQuery<any[]>({
    queryKey: ['status'],
    queryFn: async () => {
      const res = await fetch('/api/status');
      if (!res.ok) {
        throw new Error('Failed to fetch status');
      }
      return res.json();
    },
    enabled: app.isActive,
  });

  const serviceStatus = statusRes.find(s => s.id === app.id);
  const isDown = app.isActive && serviceStatus && !serviceStatus.online;

  const isPng = app.iconUrl?.toLowerCase().endsWith('.png');

  return (
    <div className="relative w-full h-full group">
      {/* Dynamic Glow Layer */}
      <div 
        className="absolute -inset-1 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: isDown ? '#ef4444' : accentColor }}
      />

      {/* Status Warning Badge (Pulse if down) */}
      {isDown && (
        <div className="absolute -top-1 -right-1 z-30 p-1 bg-red-500 rounded-full animate-pulse border-2 border-background">
          <AlertCircle className="w-4 h-4 text-white" />
        </div>
      )}

      <a 
        href={app.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block h-full relative z-10"
      >
        <div 
          className={`glass-panel h-full rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:-translate-y-2 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-500 ${isDown ? 'border-red-500/50' : ''}`}
          style={{ 
            borderColor: isDown ? 'rgba(239, 68, 68, 0.5)' : `color-mix(in srgb, ${accentColor}, transparent 60%)`,
            boxShadow: isDown 
              ? `0 8px 32px 0 rgba(239, 68, 68, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)` 
              : `0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 0 20px color-mix(in srgb, ${accentColor}, transparent 80%)`
          }}
        >
          {/* Icon */}
          <div className={`w-14 h-14 mb-4 relative flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform duration-300 overflow-hidden ${isDown ? 'border-red-500/30' : ''}`}>
            {app.iconUrl ? (
              <img
                src={app.iconUrl}
                alt={app.name}
                className={`object-contain p-2 w-full h-full ${isDown ? 'grayscale opacity-50' : ''} ${!isPng ? 'rounded-lg' : ''}`}
              />
            ) : (
              <span className={`text-2xl font-bold uppercase text-white/70`}>
                {app.name.substring(0, 2)}
              </span>
            )}
            
            {/* Status light mini indicator */}
            {app.isActive && (
              <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-black/50 ${serviceStatus?.online ? 'bg-green-500' : 'bg-red-500'}`} />
            )}
          </div>

          {/* Name */}
          <h3 className={`text-lg font-medium text-center truncate w-full group-hover:text-primary-foreground transition-colors ${isDown ? 'text-red-400' : 'text-white'}`}>
            {app.name}
          </h3>
          
          {/* Description (optional) */}
          {app.description && (
            <p className="text-xs text-muted-foreground mt-1 text-center truncate w-full">
              {app.description}
            </p>
          )}

          {/* Monitoring Disabled Badge */}
          {!app.isActive && (
            <div className="absolute bottom-2 right-2 opacity-30">
              <PowerOff className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </a>
    </div>
  );
}
