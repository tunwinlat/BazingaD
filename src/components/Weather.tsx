'use client';

import { useState, useEffect } from 'react';
import { Cloud, Wind, Compass, Loader2 } from 'lucide-react';

interface WeatherData {
  temperature: number;
  unit: string;
  condition: string;
  icon: string;
  windSpeed: number;
  windSpeedUnit: string;
  windDirection: string;
  locationName: string;
}

interface WeatherProps {
  compact?: boolean;
}

export default function Weather({ compact = false }: WeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // First check if weather is enabled
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (!settings.weatherEnabled) {
            setEnabled(false);
            setLoading(false);
            return;
          }
          setEnabled(true);
        }

        // Fetch weather data
        const response = await fetch('/api/weather');
        if (response.ok) {
          const data = await response.json();
          setWeather(data);
        } else {
          setError('Failed to load weather');
        }
      } catch (err) {
        setError('Failed to load weather');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!enabled) return null;

  if (loading) {
    if (compact) {
      return (
        <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading weather...</span>
      </div>
    );
  }

  if (error || !weather) {
    return null;
  }

  // Compact mode for InfoBar
  if (compact) {
    return (
      <div className="flex items-center gap-4">
        {/* Temperature & Icon */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{weather.icon}</span>
          <div>
            <div className="text-lg font-bold text-white">
              {weather.temperature}{weather.unit}
            </div>
            <div className="text-xs text-white/60">{weather.condition}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

        {/* Wind Info */}
        <div className="flex items-center gap-3 text-sm text-white/70">
          <div className="flex items-center gap-1">
            <Wind className="w-3.5 h-3.5" />
            <span>{weather.windSpeed} {weather.windSpeedUnit}</span>
          </div>
          <div className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            <span>{weather.windDirection}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-white/50">
          <Cloud className="w-3.5 h-3.5" />
          <span>{weather.locationName}</span>
        </div>
      </div>
    );
  }

  // Full mode (original)
  return (
    <div 
      className="rounded-2xl p-4 mb-6 flex items-center justify-between"
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Temperature & Icon */}
        <div className="flex items-center gap-3">
          <span className="text-4xl">{weather.icon}</span>
          <div>
            <div className="text-2xl font-bold text-white">
              {weather.temperature}{weather.unit}
            </div>
            <div className="text-sm text-white/60">{weather.condition}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-10" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

        {/* Wind Info */}
        <div className="flex items-center gap-4 text-sm text-white/70">
          <div className="flex items-center gap-1.5">
            <Wind className="w-4 h-4" />
            <span>{weather.windSpeed} {weather.windSpeedUnit}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            <span>{weather.windDirection}</span>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="text-right">
        <div className="flex items-center gap-1.5 text-sm text-white/50">
          <Cloud className="w-4 h-4" />
          <span>{weather.locationName}</span>
        </div>
      </div>
    </div>
  );
}
