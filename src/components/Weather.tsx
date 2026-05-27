'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { Cloud, Wind, Compass, Loader2, MapPin, Settings, X, Navigation, RotateCcw } from 'lucide-react';

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

interface UserLocation {
  lat: number;
  lon: number;
  locationName: string;
}

interface GeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  displayName: string;
  country: string;
  admin1: string;
}

interface WeatherProps {
  compact?: boolean;
  minimal?: boolean;
}

const STORAGE_KEY = 'weather-user-location';

function Weather({ compact = false, minimal = false }: WeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  // Load user location preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUserLocation(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const buildWeatherUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (userLocation) {
      params.append('lat', userLocation.lat.toString());
      params.append('lon', userLocation.lon.toString());
      params.append('locationName', userLocation.locationName);
    }
    return `/api/weather${params.toString() ? '?' + params.toString() : ''}`;
  }, [userLocation]);

  const fetchWeather = useCallback(async () => {
    setError('');
    const controller = new AbortController();

    try {
      const [settingsRes, weatherRes] = await Promise.all([
        fetch('/api/settings', { signal: controller.signal }),
        fetch(buildWeatherUrl(), { signal: controller.signal }),
      ]);

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (!settings.weatherEnabled) {
          setEnabled(false);
          setLoading(false);
          return;
        }
        setEnabled(true);
      }

      if (weatherRes.ok) {
        const data = await weatherRes.json();
        setWeather(data);
      } else {
        setError('Failed to load weather');
      }
    } catch {
      setError('Failed to load weather');
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [buildWeatherUrl]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const run = async () => {
      setLoading(true);
      const cleanup = await fetchWeather();
      intervalId = setInterval(() => {
        fetchWeather();
      }, 10 * 60 * 1000);
      return cleanup;
    };

    const promise = run();
    return () => {
      promise.then(cleanup => cleanup?.());
      clearInterval(intervalId);
    };
  }, [fetchWeather]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (res.ok && data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectLocation = (result: GeocodeResult) => {
    const loc: UserLocation = {
      lat: result.latitude,
      lon: result.longitude,
      locationName: result.displayName,
    };
    setUserLocation(loc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch {
      // ignore
    }
    setShowPicker(false);
    setSearchQuery('');
    setSearchResults([]);
    setLoading(true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: UserLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          locationName: 'Current Location',
        };
        setUserLocation(loc);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
        } catch {
          // ignore
        }
        setGeoLoading(false);
        setShowPicker(false);
        setSearchQuery('');
        setSearchResults([]);
        setLoading(true);
      },
      () => {
        setGeoLoading(false);
        setError('Unable to retrieve your location. Please check your browser permissions.');
      },
      { timeout: 10000 }
    );
  };

  const handleResetToDefault = () => {
    setUserLocation(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setShowPicker(false);
    setSearchQuery('');
    setSearchResults([]);
    setLoading(true);
  };

  if (!enabled) return null;

  // Ultra-compact glance for Status Pill
  if (minimal) {
    if (loading) {
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />;
    }
    if (error || !weather) {
      return <Cloud className="w-3.5 h-3.5 text-white/30" />;
    }
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-base leading-none">{weather.icon}</span>
        <span className="text-sm font-semibold text-white/90">
          {weather.temperature}{weather.unit}
        </span>
      </div>
    );
  }

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
      <>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
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

          {/* Divider - hidden on very small screens */}
          <div className="hidden sm:block w-px h-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {/* Wind Info - wraps on small screens */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/70">
            <div className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5" />
              <span>{weather.windSpeed} {weather.windSpeedUnit}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>{weather.windDirection}</span>
            </div>
          </div>

          {/* Location with settings button */}
          <div className="flex items-center gap-1.5 text-xs text-white/50 min-w-0">
            <Cloud className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate max-w-[80px] sm:max-w-[120px] lg:max-w-[160px]">{weather.locationName}</span>
            <button
              onClick={() => setShowPicker(true)}
              className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Change weather location"
              title="Change weather location"
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Location Picker Modal */}
        {showPicker && (
          <WeatherLocationPicker
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            searching={searching}
            geoLoading={geoLoading}
            userLocation={userLocation}
            onSearch={handleSearch}
            onSelect={handleSelectLocation}
            onUseCurrent={handleUseCurrentLocation}
            onReset={handleResetToDefault}
            onClose={() => {
              setShowPicker(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          />
        )}
      </>
    );
  }

  // Full mode
  return (
    <>
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
            <button
              onClick={() => setShowPicker(true)}
              className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
              aria-label="Change weather location"
              title="Change weather location"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showPicker && (
        <WeatherLocationPicker
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          searching={searching}
          geoLoading={geoLoading}
          userLocation={userLocation}
          onSearch={handleSearch}
          onSelect={handleSelectLocation}
          onUseCurrent={handleUseCurrentLocation}
          onReset={handleResetToDefault}
          onClose={() => {
            setShowPicker(false);
            setSearchQuery('');
            setSearchResults([]);
          }}
        />
      )}
    </>
  );
}

export default memo(Weather);

// ------------------------------------------------------------------
// Location Picker Modal
// ------------------------------------------------------------------

interface PickerProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: GeocodeResult[];
  searching: boolean;
  geoLoading: boolean;
  userLocation: UserLocation | null;
  onSearch: () => void;
  onSelect: (r: GeocodeResult) => void;
  onUseCurrent: () => void;
  onReset: () => void;
  onClose: () => void;
}

function WeatherLocationPicker({
  searchQuery,
  setSearchQuery,
  searchResults,
  searching,
  geoLoading,
  userLocation,
  onSearch,
  onSelect,
  onUseCurrent,
  onReset,
  onClose,
}: PickerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="weather-location-title"
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{
          backgroundColor: 'rgba(20, 20, 35, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 id="weather-location-title" className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Weather Location
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current selection */}
        <div className="mb-4 text-sm text-white/60">
          {userLocation ? (
            <span>
              Using: <span className="text-white/80 font-medium">{userLocation.locationName}</span>
            </span>
          ) : (
            <span>Using admin default location</span>
          )}
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Search city..."
            className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
          <button
            onClick={onSearch}
            disabled={searching || searchQuery.trim().length < 2}
            className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-lg mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => onSelect(result)}
                className="w-full text-left px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors border-b last:border-b-0"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <div className="font-medium">{result.displayName}</div>
                <div className="text-xs text-white/40">
                  {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={onUseCurrent}
            disabled={geoLoading}
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600/80 hover:bg-emerald-500/80 disabled:opacity-50 transition-colors"
          >
            {geoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            Use My Current Location
          </button>

          {userLocation && (
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Admin Default
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
