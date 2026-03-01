'use client';

import { useState, useEffect, useCallback } from 'react';
import { Car, AlertTriangle } from 'lucide-react';

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
  error?: string;
}

interface TrafficDisplayProps {
  settings: {
    enabled: boolean;
    homeAddress: string;
    workAddress: string;
  } | null;
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
  if (staticDuration === 0) return '#34d399'; // Green (no data)
  
  const ratio = duration / staticDuration;
  
  if (ratio <= 1.1) {
    return '#34d399'; // Green - normal traffic
  } else if (ratio <= 1.3) {
    return '#fbbf24'; // Yellow - moderate traffic
  } else {
    return '#f87171'; // Red - heavy traffic
  }
}

// Get traffic status text
function getTrafficStatus(duration: number, staticDuration: number): string {
  if (staticDuration === 0) return 'Normal';
  
  const ratio = duration / staticDuration;
  
  if (ratio <= 1.1) {
    return 'Good';
  } else if (ratio <= 1.3) {
    return 'Moderate';
  } else {
    return 'Heavy';
  }
}

export default function TrafficDisplay({ settings }: TrafficDisplayProps) {
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const fetchTrafficData = useCallback(async () => {
    if (!settings?.enabled) return;
    if (!isVisible) return; // Don't fetch if tab is not visible

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

  // Initial fetch and visibility handling
  useEffect(() => {
    if (!settings?.enabled) return;

    // Fetch immediately on mount
    fetchTrafficData();

    // Set up visibility change listener
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);
      
      // Fetch when tab becomes visible
      if (visible) {
        fetchTrafficData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up periodic refresh (every 5 minutes when visible)
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchTrafficData();
      }
    }, 5 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [settings?.enabled, fetchTrafficData]);

  if (!settings?.enabled) {
    return null;
  }

  // Show compact error indicator
  if (error) {
    return (
      <div 
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
        title={error}
      >
        <AlertTriangle className="w-4 h-4" style={{ color: '#f87171' }} />
        <span style={{ color: '#f87171' }}>Traffic Error</span>
      </div>
    );
  }

  // Show loading state
  if (loading && !trafficData) {
    return (
      <div 
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm animate-pulse"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        <Car className="w-4 h-4 text-white/50" />
        <span className="text-white/50">Loading...</span>
      </div>
    );
  }

  // Show traffic data
  if (trafficData?.homeToWork && trafficData?.workToHome) {
    const homeToWorkColor = getTrafficColor(
      trafficData.homeToWork.duration,
      trafficData.homeToWork.staticDuration
    );
    const workToHomeColor = getTrafficColor(
      trafficData.workToHome.duration,
      trafficData.workToHome.staticDuration
    );

    return (
      <div className="flex items-center gap-3">
        {/* Home to Work */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
          style={{ backgroundColor: `${homeToWorkColor}20` }}
          title={`Home to Work: ${getTrafficStatus(trafficData.homeToWork.duration, trafficData.homeToWork.staticDuration)} traffic`}
        >
          <Car className="w-4 h-4" style={{ color: homeToWorkColor }} />
          <span style={{ color: homeToWorkColor }}>
            → Work: {formatDuration(trafficData.homeToWork.duration)}
          </span>
        </div>

        {/* Work to Home */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
          style={{ backgroundColor: `${workToHomeColor}20` }}
          title={`Work to Home: ${getTrafficStatus(trafficData.workToHome.duration, trafficData.workToHome.staticDuration)} traffic`}
        >
          <Car className="w-4 h-4" style={{ color: workToHomeColor }} />
          <span style={{ color: workToHomeColor }}>
            → Home: {formatDuration(trafficData.workToHome.duration)}
          </span>
        </div>

        {/* Cache indicator */}
        {trafficData.cached && (
          <span className="text-xs text-white/30" title="Using cached data">
            cached
          </span>
        )}
      </div>
    );
  }

  // No data yet
  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
    >
      <Car className="w-4 h-4 text-white/30" />
      <span className="text-white/30">No traffic data</span>
    </div>
  );
}
