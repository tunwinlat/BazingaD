'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { Car, AlertTriangle, Info } from 'lucide-react';

interface TrafficData {
  homeToWork: {
    duration: number;
    staticDuration: number;
  } | null;
  workToHome: {
    duration: number;
    staticDuration: number;
  } | null;
  cached: boolean;
  cacheAge?: number;
  error?: string;
}

interface TrafficDisplayProps {
  settings: {
    enabled: boolean;
    homeAddress: string;
    workAddress: string;
  } | null;
  minimal?: boolean;
}

// Format seconds to hours and minutes
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Get color based on traffic condition
function getTrafficColor(duration: number, staticDuration: number): string {
  if (staticDuration === 0) return '#34d399';
  const ratio = duration / staticDuration;
  if (ratio <= 1.1) return '#34d399';
  if (ratio <= 1.3) return '#fbbf24';
  return '#f87171';
}

// Get traffic status text
function getTrafficStatus(duration: number, staticDuration: number): string {
  if (staticDuration === 0) return 'Normal';
  const ratio = duration / staticDuration;
  if (ratio <= 1.1) return 'Good';
  if (ratio <= 1.3) return 'Moderate';
  return 'Heavy';
}

function TrafficDisplay({ settings, minimal = false }: TrafficDisplayProps) {
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const fetchTrafficData = useCallback(async () => {
    if (!settings?.enabled) return;
    if (!isVisible) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/traffic');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch traffic data');
      }

      setTrafficData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [settings?.enabled, isVisible]);

  useEffect(() => {
    if (!settings?.enabled) return;
    fetchTrafficData();

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);
      if (visible) fetchTrafficData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') fetchTrafficData();
    }, 5 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [settings?.enabled, fetchTrafficData]);

  // Cleanup: reset state when unmounted or settings change significantly
  useEffect(() => {
    return () => {
      setTrafficData(null);
      setError(null);
      setLoading(false);
    };
  }, []);

  if (!settings?.enabled) {
    return null;
  }

  // Ultra-compact status dot for Status Pill
  if (minimal) {
    if (error) {
      return <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} title={error} />;
    }
    if (loading && !trafficData) {
      return <div className="w-2.5 h-2.5 rounded-full animate-pulse bg-white/20" />;
    }
    if (trafficData?.homeToWork && trafficData?.workToHome) {
      const hwColor = getTrafficColor(trafficData.homeToWork.duration, trafficData.homeToWork.staticDuration);
      const whColor = getTrafficColor(trafficData.workToHome.duration, trafficData.workToHome.staticDuration);
      // Show the worse of the two
      const worstColor = [hwColor, whColor].includes('#f87171') ? '#f87171'
        : [hwColor, whColor].includes('#fbbf24') ? '#fbbf24'
        : '#34d399';
      return <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: worstColor }} title="Traffic status" />;
    }
    return <div className="w-2.5 h-2.5 rounded-full bg-white/10" />;
  }

  if (error) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
        title={error}
      >
        <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
        <span style={{ color: '#f87171' }}>Traffic Error</span>
      </div>
    );
  }

  if (loading && !trafficData) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs animate-pulse"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        <Car className="w-3.5 h-3.5 text-white/50" />
        <span className="text-white/50">Loading...</span>
      </div>
    );
  }

  if (trafficData?.homeToWork && trafficData?.workToHome) {
    const hwColor = getTrafficColor(trafficData.homeToWork.duration, trafficData.homeToWork.staticDuration);
    const whColor = getTrafficColor(trafficData.workToHome.duration, trafficData.workToHome.staticDuration);

    const cacheTooltip = trafficData.cached
      ? `Cached ${trafficData.cacheAge ?? '?'} minutes ago`
      : 'Live data';

    return (
      <div className="flex flex-col gap-1.5">
        {/* Home → Work */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
          style={{ backgroundColor: `${hwColor}18` }}
          title={`Home to Work: ${getTrafficStatus(trafficData.homeToWork.duration, trafficData.homeToWork.staticDuration)} traffic`}
        >
          <Car className="w-3 h-3 flex-shrink-0" style={{ color: hwColor }} />
          <span style={{ color: hwColor }}>→ Work: {formatDuration(trafficData.homeToWork.duration)}</span>
        </div>

        {/* Work → Home */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
          style={{ backgroundColor: `${whColor}18` }}
          title={`Work to Home: ${getTrafficStatus(trafficData.workToHome.duration, trafficData.workToHome.staticDuration)} traffic`}
        >
          <Car className="w-3 h-3 flex-shrink-0" style={{ color: whColor }} />
          <span style={{ color: whColor }}>→ Home: {formatDuration(trafficData.workToHome.duration)}</span>
        </div>

        {/* Cache indicator — subtle centered */}
        {trafficData.cached && (
          <div className="flex items-center justify-center gap-1">
            <Info className="w-2.5 h-2.5 text-white/20" />
            <span
              className="text-[10px] text-white/25"
              title={cacheTooltip}
            >
              {trafficData.cacheAge !== undefined && trafficData.cacheAge > 30 ? (
                <span style={{ color: 'rgba(248,113,113,0.6)' }}>stale ({trafficData.cacheAge}m)</span>
              ) : (
                <span>cached {trafficData.cacheAge ?? '?'}m</span>
              )}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
    >
      <Car className="w-3.5 h-3.5 text-white/30" />
      <span className="text-white/30">No traffic data</span>
    </div>
  );
}

export default memo(TrafficDisplay);
