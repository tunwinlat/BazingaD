'use client';

import { useState, useEffect } from 'react';
import Weather from './Weather';
import TrafficDisplay from './TrafficDisplay';

interface TrafficSettings {
  enabled: boolean;
  homeAddress: string;
  workAddress: string;
}

export default function InfoBar() {
  const [trafficSettings, setTrafficSettings] = useState<TrafficSettings | null>(null);

  useEffect(() => {
    const fetchTrafficSettings = async () => {
      try {
        const response = await fetch('/api/settings/traffic');
        if (response.ok) {
          const data = await response.json();
          setTrafficSettings({
            enabled: data.enabled,
            homeAddress: data.homeAddress,
            workAddress: data.workAddress,
          });
        }
      } catch (error) {
        console.error('Failed to fetch traffic settings:', error);
      }
    };

    fetchTrafficSettings();
  }, []);

  const hasWeather = true; // Weather component handles its own enabled check
  const hasTraffic = trafficSettings?.enabled ?? false;

  if (!hasWeather && !hasTraffic) {
    return null;
  }

  return (
    <div 
      className="rounded-2xl p-4 mb-6"
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Weather - Left side */}
        <div className="flex-1 min-w-[200px]">
          <Weather compact />
        </div>

        {/* Traffic - Right side */}
        {hasTraffic && (
          <div className="flex items-center">
            <TrafficDisplay settings={trafficSettings} />
          </div>
        )}
      </div>
    </div>
  );
}
