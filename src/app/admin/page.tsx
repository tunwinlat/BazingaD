'use client';

import { useState, useEffect, useRef, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Edit, X, RefreshCw, LogOut, Shield, Key, QrCode, Copy, Check, AlertTriangle, Lock, Settings2, Cloud, MapPin, Thermometer, Globe, Upload, RotateCcw, Loader2, Eye, EyeOff, ChevronDown, ChevronUp, GripVertical, Newspaper, Radio, Tag, Clock } from 'lucide-react';
import type { Category, Block, CategoryFormData, BlockFormData } from '@/types';

// Convert hours to best unit for display
const hoursToDisplay = (hours: number): { value: number; unit: 'hours' | 'days' | 'months' } => {
  if (hours >= 24 * 30) {
    return { value: Math.round(hours / (24 * 30)), unit: 'months' };
  } else if (hours >= 24) {
    return { value: Math.round(hours / 24), unit: 'days' };
  }
  return { value: hours, unit: 'hours' };
};

// Convert display value to hours for API
const displayToHours = (value: number, unit: 'hours' | 'days' | 'months'): number => {
  switch (unit) {
    case 'months': return value * 24 * 30;
    case 'days': return value * 24;
    case 'hours': return value;
  }
};


// ConfirmModal component
function ConfirmModal({ open, title, message, onConfirm, onCancel }: { open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <p className="text-sm text-white/70 mb-6">{message}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg transition-colors hover:bg-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg transition-colors hover:bg-indigo-600" style={{ backgroundColor: '#6366f1' }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}


// Escape key handler for modals
function EscapeHandler({ onEscape }: { onEscape: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape]);
  return null;
}

// LogoutButton component
function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login?logout=success');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-red-500/20"
      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}
    >
      <LogOut className="w-4 h-4" />
      Logout
    </button>
  );
}

function AdminPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'blocks' | 'security' | 'integrations'>('blocks');
  const [expandedIntegration, setExpandedIntegration] = useState<'weather' | 'traffic' | 'news' | null>('weather');

  // Security states
  const [authStatus, setAuthStatus] = useState<{ username: string; totpEnabled: boolean } | null>(null);
  const [showTOTPSetup, setShowTOTPSetup] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDisableTOTP, setShowDisableTOTP] = useState(false);
  const [totpSetupData, setTotpSetupData] = useState<{ qrCode: string; secret: string; recoveryCode: string } | null>(null);
  const [totpVerificationCode, setTotpVerificationCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);

  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  // Form data
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({ name: '', icon: 'default', sortOrder: 0, disabled: false });
  const [blockForm, setBlockForm] = useState<BlockFormData>({
    title: '',
    url: '',
    description: '',
    icon: '',
    categoryId: '',
    sortOrder: 0,
    serviceUrl: '',
    serviceType: '',
    healthCheckUrl: '',
    isMonitored: false,
  });

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDashboardPassword, setShowDashboardPassword] = useState(false);
  const [showDisableTOTPPassword, setShowDisableTOTPPassword] = useState(false);

  // Dashboard protection settings
  const [settings, setSettings] = useState({
    dashboardProtected: false,
    sessionDurationHours: 24,
    weatherEnabled: false,
    weatherLatitude: null as number | null,
    weatherLongitude: null as number | null,
    weatherLocationName: '',
    weatherUnits: 'metric' as 'metric' | 'imperial',
  });
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState<'hours' | 'days' | 'months'>('days');
  const [showDashboardSettings, setShowDashboardSettings] = useState(false);
  const [dashboardPassword, setDashboardPassword] = useState('');
  const [activeSessions, setActiveSessions] = useState(0);

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    siteTitle: 'Start Page',
    favicon: null as string | null,
    theme: 'default',
    defaultView: 'comfortable',
    openInNewTab: true,
    navTransitionEnabled: false,
    navTransitionType: 'overlay' as 'overlay' | 'exit',
  });
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [availableThemes, setAvailableThemes] = useState<Array<{ id: string; name: string }>>([]);

  // Traffic settings
  const [trafficSettings, setTrafficSettings] = useState({
    enabled: false,
    apiKey: '',
    tomTomApiKey: '',
    primaryProvider: 'google' as 'google' | 'tomtom',
    homeAddress: '',
    workAddress: '',
    travelMode: 'DRIVE' as 'DRIVE' | 'BICYCLE' | 'WALK' | 'TWO_WHEELER' | 'TRANSIT',
    units: 'metric' as 'metric' | 'imperial',
  });
  const [showTrafficApiKey, setShowTrafficApiKey] = useState(false);
  const [showTomTomApiKey, setShowTomTomApiKey] = useState(false);

  // News settings
  const [newsSettings, setNewsSettings] = useState({
    enabled: false,
    apiKey: '',
    checkIntervalMinutes: 60,
    unreadRetentionHours: 24,
    readRetentionHours: 8,
    maxArticleAgeHours: 24,
  });
  const [showNewsApiKey, setShowNewsApiKey] = useState(false);
  const [newsFeeds, setNewsFeeds] = useState<Array<{ id: string; name: string; url: string; isDefault: boolean; isEnabled: boolean }>>([]);
  const [newsTopics, setNewsTopics] = useState<Array<{ id: string; phrase: string }>>([]);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newTopic, setNewTopic] = useState('');

  // Weather settings
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<Array<{
    name: string;
    admin1?: string;
    country?: string;
    latitude: number;
    longitude: number;
    displayName: string;
  }>>([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [showLocationResults, setShowLocationResults] = useState(false);

  // Disable TOTP form
  const [disableTOTPForm, setDisableTOTPForm] = useState({
    password: '',
    code: '',
  });

  // Loading states
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingBlock, setIsSavingBlock] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState<string | null>(null);
  const [isDeletingBlock, setIsDeletingBlock] = useState<string | null>(null);

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Clipboard copy timeout refs
  const timeoutRefs = useRef<{ secret: ReturnType<typeof setTimeout> | null; recovery: ReturnType<typeof setTimeout> | null }>({ secret: null, recovery: null });

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const pendingConfirmAction = useRef<(() => void) | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [, isAuth] = await Promise.all([
          fetchData(),
          fetchAuthStatus(),
          fetchSettings(),
          fetchSessions(),
          fetchGeneralSettings(),
          fetchThemes(),
          fetchTrafficSettings(),
          fetchNewsSettings(),
          fetchNewsFeeds(),
          fetchNewsTopics(),
        ]);
        // Only reveal the admin UI if the user is authenticated.
        // When unauthenticated, fetchAuthStatus triggers a redirect to /login;
        // keeping loading=true prevents the admin UI from flashing before navigation completes.
        if (isAuth) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load admin data:', error);
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeouts = timeoutRefs.current;
    return () => {
      if (timeouts.secret) clearTimeout(timeouts.secret);
      if (timeouts.recovery) clearTimeout(timeouts.recovery);
    };
  }, []);

  useEffect(() => {
    if (editingCategory) {
      setCategoryForm({
        name: editingCategory.name,
        icon: editingCategory.icon,
        sortOrder: editingCategory.sortOrder,
        disabled: editingCategory.disabled,
      });
    } else {
      setCategoryForm({ name: '', icon: 'default', sortOrder: 0, disabled: false });
    }
  }, [editingCategory]);

  useEffect(() => {
    if (editingBlock) {
      setBlockForm({
        title: editingBlock.title,
        url: editingBlock.url,
        description: editingBlock.description || '',
        icon: editingBlock.icon || '',
        categoryId: editingBlock.categoryId,
        sortOrder: editingBlock.sortOrder,
        serviceUrl: editingBlock.serviceUrl || '',
        serviceType: editingBlock.serviceType || '',
        healthCheckUrl: editingBlock.healthCheckUrl || '',
        isMonitored: editingBlock.isMonitored,
      });
    } else {
      setBlockForm({
        title: '',
        url: '',
        description: '',
        icon: '',
        categoryId: categories[0]?.id || '',
        sortOrder: 0,
        serviceUrl: '',
        serviceType: '',
        healthCheckUrl: '',
        isMonitored: false,
      });
    }
  }, [editingBlock, categories]);

  const fetchData = async () => {
    try {
      const [catRes, blockRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/blocks'),
      ]);
      const cats = await catRes.json();
      const blks = await blockRes.json();
      setCategories(cats);
      setBlocks(blks);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const fetchAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        setAuthStatus(data);
        return true;
      } else if (response.status === 401) {
        // Not authenticated, redirect to login
        router.push('/login');
        return false;
      }
    } catch (error) {
      console.error('Failed to fetch auth status:', error);
    }
    return false;
  };




  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        // Set the display values
        const display = hoursToDisplay(data.sessionDurationHours);
        setDurationValue(display.value);
        setDurationUnit(display.unit);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/auth/sessions');
      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const fetchGeneralSettings = async () => {
    try {
      const response = await fetch('/api/settings/general');
      if (response.ok) {
        const data = await response.json();
        setGeneralSettings({
          siteTitle: data.siteTitle || 'Start Page',
          favicon: data.favicon || null,
          theme: data.theme || 'default',
          defaultView: data.defaultView || 'comfortable',
          openInNewTab: data.openInNewTab ?? true,
          navTransitionEnabled: data.navTransitionEnabled ?? false,
          navTransitionType: data.navTransitionType === 'exit' ? 'exit' : 'overlay',
        });
        setFaviconPreview(data.favicon || null);
      }
    } catch (error) {
      console.error('Failed to fetch general settings:', error);
    }
  };

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/themes');
      if (response.ok) {
        const data = await response.json();
        setAvailableThemes(data);
      }
    } catch (error) {
      console.error('Failed to fetch themes:', error);
    }
  };

  const fetchTrafficSettings = async () => {
    try {
      const response = await fetch('/api/settings/traffic');
      if (response.ok) {
        const data = await response.json();
        setTrafficSettings({
          enabled: data.enabled ?? false,
          apiKey: data.apiKey || '',
          tomTomApiKey: data.tomTomApiKey || '',
          primaryProvider: data.primaryProvider || 'google',
          homeAddress: data.homeAddress || '',
          workAddress: data.workAddress || '',
          travelMode: data.travelMode || 'DRIVE',
          units: data.units || 'metric',
        });
      }
    } catch (error) {
      console.error('Failed to fetch traffic settings:', error);
    }
  };

  const fetchNewsSettings = async () => {
    try {
      const response = await fetch('/api/news/settings');
      if (response.ok) {
        const data = await response.json();
        setNewsSettings({
          enabled: data.enabled ?? false,
          apiKey: data.apiKey || '',
          checkIntervalMinutes: data.checkIntervalMinutes ?? 60,
          unreadRetentionHours: data.unreadRetentionHours ?? 24,
          readRetentionHours: data.readRetentionHours ?? 8,
          maxArticleAgeHours: data.maxArticleAgeHours ?? 24,
        });
      }
    } catch (error) {
      console.error('Failed to fetch news settings:', error);
    }
  };

  const fetchNewsFeeds = async () => {
    try {
      const response = await fetch('/api/news/feeds');
      if (response.ok) {
        const data = await response.json();
        setNewsFeeds(data);
      }
    } catch (error) {
      console.error('Failed to fetch news feeds:', error);
    }
  };

  const fetchNewsTopics = async () => {
    try {
      const response = await fetch('/api/news/topics');
      if (response.ok) {
        const data = await response.json();
        setNewsTopics(data);
      }
    } catch (error) {
      console.error('Failed to fetch news topics:', error);
    }
  };

  // TOTP handlers
  const handleSetupTOTP = async () => {
    try {
      const response = await fetch('/api/auth/totp/setup');
      if (response.ok) {
        const data = await response.json();
        setTotpSetupData(data);
        setShowTOTPSetup(true);
      } else {
        toast.error('Failed to setup TOTP');
      }
    } catch (error) {
      console.error('TOTP setup error:', error);
    }
  };

  const handleVerifyTOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpVerificationCode }),
      });

      if (response.ok) {
        toast.success('TOTP enabled successfully!');
        setShowTOTPSetup(false);
        setTotpSetupData(null);
        setTotpVerificationCode('');
        fetchAuthStatus();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('TOTP verify error:', error);
    }
  };

  const handleDisableTOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/totp/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(disableTOTPForm),
      });

      if (response.ok) {
        toast.success('TOTP disabled successfully');
        setShowDisableTOTP(false);
        setDisableTOTPForm({ password: '', code: '' });
        fetchAuthStatus();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to disable TOTP');
      }
    } catch (error) {
      console.error('Disable TOTP error:', error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        toast.success('Password changed successfully');
        setShowPasswordChange(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'recovery') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      if (timeoutRefs.current.secret) clearTimeout(timeoutRefs.current.secret);
      timeoutRefs.current.secret = setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedRecovery(true);
      if (timeoutRefs.current.recovery) clearTimeout(timeoutRefs.current.recovery);
      timeoutRefs.current.recovery = setTimeout(() => setCopiedRecovery(false), 2000);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const hours = displayToHours(durationValue, durationUnit);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardProtected: settings.dashboardProtected,
          sessionDurationHours: hours,
          ...(dashboardPassword && { dashboardPassword }),
        }),
      });

      if (response.ok) {
        toast.success('Settings updated successfully');
        setShowDashboardSettings(false);
        setDashboardPassword('');
        fetchSettings();
      } else {
        const data = await response.json();
        console.error('Settings update failed:', data);
        const errorMsg = data.details
          ? `${data.error}: ${data.details.map((d: {message: string}) => d.message).join(', ')}`
          : data.error || 'Failed to update settings';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Settings update error:', error);
    }
  };

  const openConfirm = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    pendingConfirmAction.current = action;
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    pendingConfirmAction.current?.();
    pendingConfirmAction.current = null;
    setConfirmOpen(false);
  };

  const handleCancelConfirm = () => {
    pendingConfirmAction.current = null;
    setConfirmOpen(false);
  };

  const handleLogoutAllSessions = async () => {
    openConfirm('Logout All Sessions', 'This will log out all users from all sessions, including yourself. Continue?', async () => {
      try {
        const response = await fetch('/api/auth/sessions', {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('All sessions logged out. You will be redirected to login.');
          router.push('/login');
        } else {
          toast.error('Failed to logout sessions');
        }
      } catch (error) {
        console.error('Logout all error:', error);
      }
    });
  };

  // Weather handlers
  const handleGetLocation = () => {
    setLocationLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings({
          ...settings,
          weatherLatitude: position.coords.latitude,
          weatherLongitude: position.coords.longitude,
          weatherLocationName: 'Current Location',
        });
        setLocationLoading(false);
      },
      (error) => {
        let errorMsg = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out.';
            break;
        }
        setLocationError(errorMsg);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Location search handler
  const handleLocationSearch = async () => {
    if (!locationSearchQuery.trim() || locationSearchQuery.trim().length < 2) {
      setLocationError('Please enter at least 2 characters');
      return;
    }

    setLocationSearchLoading(true);
    setLocationError('');
    setShowLocationResults(false);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(locationSearchQuery.trim())}`);
      const data = await response.json();

      if (response.ok && data.results) {
        setLocationSearchResults(data.results);
        setShowLocationResults(true);
      } else {
        setLocationError(data.error || 'No locations found');
      }
    } catch {
      setLocationError('Failed to search location');
    } finally {
      setLocationSearchLoading(false);
    }
  };

  const handleSelectLocation = (location: typeof locationSearchResults[0]) => {
    setSettings({
      ...settings,
      weatherLatitude: location.latitude,
      weatherLongitude: location.longitude,
      weatherLocationName: location.displayName,
    });
    setLocationSearchQuery('');
    setLocationSearchResults([]);
    setShowLocationResults(false);
    setLocationError('');
  };

  const handleSaveWeatherSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weatherEnabled: settings.weatherEnabled,
          weatherLatitude: settings.weatherLatitude,
          weatherLongitude: settings.weatherLongitude,
          weatherLocationName: settings.weatherLocationName,
          weatherUnits: settings.weatherUnits,
        }),
      });

      if (response.ok) {
        toast.success('Weather settings saved');
        fetchSettings();
      } else {
        toast.error('Failed to save weather settings');
      }
    } catch (error) {
      console.error('Weather settings save error:', error);
    }
  };

  // General settings handlers
  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only allow SVG files for security
    if (file.type !== 'image/svg+xml') {
      toast.error('Please upload an SVG file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFaviconPreview(result);
        setGeneralSettings({ ...generalSettings, favicon: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetFavicon = () => {
    setFaviconPreview(null);
    setGeneralSettings({ ...generalSettings, favicon: null });
  };

  const handleSaveGeneralSettings = async () => {
    try {
      const response = await fetch('/api/settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteTitle: generalSettings.siteTitle,
          favicon: generalSettings.favicon,
          theme: generalSettings.theme,
          defaultView: generalSettings.defaultView,
          openInNewTab: generalSettings.openInNewTab,
          navTransitionEnabled: generalSettings.navTransitionEnabled,
          navTransitionType: generalSettings.navTransitionType,
        }),
      });

      if (response.ok) {
        toast.success('General settings saved');
        fetchGeneralSettings();
        // Navigate to start page after a short delay so toast can be seen
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        let errorMessage = 'Failed to save general settings';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Save error:', errorData);
        } catch {
          // Response wasn't JSON
          const text = await response.text();
          console.error('Save error (non-JSON):', text);
          if (response.status === 429) {
            errorMessage = 'Too many requests. Please wait a moment before trying again.';
          }
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('General settings save error:', error);
      toast.error('Network error. Please check your connection.');
    }
  };

  const handleSaveTrafficSettings = async () => {
    try {
      const response = await fetch('/api/settings/traffic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: trafficSettings.enabled,
          apiKey: trafficSettings.apiKey,
          tomTomApiKey: trafficSettings.tomTomApiKey,
          primaryProvider: trafficSettings.primaryProvider,
          homeAddress: trafficSettings.homeAddress,
          workAddress: trafficSettings.workAddress,
          travelMode: trafficSettings.travelMode,
          units: trafficSettings.units,
        }),
      });

      if (response.ok) {
        toast.success('Traffic settings saved');
        fetchTrafficSettings();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save traffic settings');
        console.error('Save error:', errorData);
      }
    } catch (error) {
      console.error('Traffic settings save error:', error);
    }
  };

  const handleSaveNewsSettings = async () => {
    try {
      const response = await fetch('/api/news/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsEnabled: newsSettings.enabled,
          newsApiKey: newsSettings.apiKey || null,
          newsCheckIntervalMinutes: newsSettings.checkIntervalMinutes,
          newsUnreadRetentionHours: newsSettings.unreadRetentionHours,
          newsReadRetentionHours: newsSettings.readRetentionHours,
          newsMaxArticleAgeHours: newsSettings.maxArticleAgeHours,
        }),
      });

      if (response.ok) {
        toast.success('News settings saved');
        fetchNewsSettings();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save news settings');
      }
    } catch (error) {
      console.error('News settings save error:', error);
      toast.error('Network error saving news settings');
    }
  };

  const handleClearNewsCache = async () => {
    try {
      const response = await fetch('/api/news/cache/clear', { method: 'POST' });
      if (response.ok) {
        toast.success('News cache cleared');
      } else {
        toast.error('Failed to clear news cache');
      }
    } catch (error) {
      console.error('Clear cache error:', error);
      toast.error('Network error clearing cache');
    }
  };

  const handleToggleFeed = async (id: string, isEnabled: boolean) => {
    try {
      const response = await fetch(`/api/news/feeds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      });
      if (response.ok) {
        fetchNewsFeeds();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to toggle feed');
      }
    } catch (error) {
      console.error('Toggle feed error:', error);
    }
  };

  const handleDeleteFeed = async (id: string) => {
    try {
      const response = await fetch(`/api/news/feeds/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchNewsFeeds();
        toast.success('Feed deleted');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete feed');
      }
    } catch (error) {
      console.error('Delete feed error:', error);
    }
  };

  const handleAddFeed = async () => {
    if (!newFeedName.trim() || !newFeedUrl.trim()) {
      toast.error('Feed name and URL are required');
      return;
    }
    try {
      const response = await fetch('/api/news/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFeedName, url: newFeedUrl }),
      });
      if (response.ok) {
        setNewFeedName('');
        setNewFeedUrl('');
        fetchNewsFeeds();
        toast.success('Feed added');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add feed');
      }
    } catch (error) {
      console.error('Add feed error:', error);
    }
  };

  const handleAddTopic = async () => {
    if (!newTopic.trim()) {
      toast.error('Topic phrase is required');
      return;
    }
    try {
      const response = await fetch('/api/news/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: newTopic }),
      });
      if (response.ok) {
        setNewTopic('');
        fetchNewsTopics();
        toast.success('Topic added');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add topic');
      }
    } catch (error) {
      console.error('Add topic error:', error);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    try {
      const response = await fetch(`/api/news/topics/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchNewsTopics();
        toast.success('Topic deleted');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete topic');
      }
    } catch (error) {
      console.error('Delete topic error:', error);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCategory(true);
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save category');
      }

      toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      setShowCategoryForm(false);
      setEditingCategory(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBlock(true);
    try {
      const url = editingBlock ? `/api/blocks/${editingBlock.id}` : '/api/blocks';
      const method = editingBlock ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockForm),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.details && Array.isArray(data.details)) {
          const details = data.details.map((d: {field: string, message: string}) => `${d.field}: ${d.message}`).join(', ');
          throw new Error(`${data.error}: ${details}`);
        }
        throw new Error(data.error || 'Failed to save block');
      }

      toast.success(editingBlock ? 'Block updated successfully' : 'Block created successfully');
      setShowBlockForm(false);
      setEditingBlock(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save block:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save block');
    } finally {
      setIsSavingBlock(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    openConfirm('Delete Category', 'Delete this category? All blocks in it will be deleted too.', async () => {
      setIsDeletingCategory(id);
      try {
        const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete category');
        }

        toast.success('Category deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Failed to delete category:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete category');
      } finally {
        setIsDeletingCategory(null);
      }
    });
  };

  const handleDeleteBlock = async (id: string) => {
    openConfirm('Delete Block', 'Delete this block?', async () => {
      setIsDeletingBlock(id);
      try {
        const response = await fetch(`/api/blocks/${id}`, { method: 'DELETE' });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete block');
        }

        toast.success('Block deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Failed to delete block:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete block');
      } finally {
        setIsDeletingBlock(null);
      }
    });
  };

  const handleCheckHealth = async (blockId: string) => {
    try {
      const res = await fetch(`/api/health/${blockId}`);
      const data = await res.json();
      toast.success(`Status: ${data.status}${data.responseTime ? ` (${data.responseTime}ms)` : ''}`);
      fetchData();
    } catch {
      toast.error('Health check failed');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = categories.findIndex((c) => c.id === draggedId);
    const targetIndex = categories.findIndex((c) => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Reorder locally
    const newCategories = [...categories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, removed);

    // Update sortOrder for all categories
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      sortOrder: index,
    }));

    setCategories(updatedCategories);
    setDraggedId(null);

    // Persist to server
    setIsReordering(true);
    try {
      const response = await fetch('/api/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: updatedCategories.map((cat) => ({
            id: cat.id,
            sortOrder: cat.sortOrder,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      toast.success('Categories reordered');
    } catch (error) {
      console.error('Failed to reorder categories:', error);
      toast.error('Failed to save category order');
      // Revert by refetching
      fetchData();
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const closeCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  const closeBlockForm = () => {
    setShowBlockForm(false);
    setEditingBlock(null);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f1a' }}>
        <div className="w-10 h-10 border-3 rounded-full animate-spin"
          style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#6366f1' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6" style={{ backgroundColor: '#0f0f1a' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Start Page
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('blocks')}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: activeTab === 'blocks' ? '#6366f1' : 'rgba(255,255,255,0.05)',
            }}
          >
            Blocks ({blocks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: activeTab === 'categories' ? '#6366f1' : 'rgba(255,255,255,0.05)',
            }}
          >
            Categories ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            style={{
              backgroundColor: activeTab === 'general' ? '#6366f1' : 'rgba(255,255,255,0.05)',
            }}
          >
            <Settings2 className="w-4 h-4" />
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            style={{
              backgroundColor: activeTab === 'security' ? '#6366f1' : 'rgba(255,255,255,0.05)',
            }}
          >
            <Shield className="w-4 h-4" />
            Security
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('integrations')}
            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            style={{
              backgroundColor: activeTab === 'integrations' ? '#6366f1' : 'rgba(255,255,255,0.05)',
            }}
          >
            <Cloud className="w-4 h-4" />
            Integrations
          </button>
        </div>

        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Categories</h2>
              <button
                type="button"
                onClick={() => { setEditingCategory(null); setShowCategoryForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#6366f1' }}
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            <div className="rounded-xl overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <table className="w-full">
                <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <tr>
                    <th className="text-left p-4 w-10"></th>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Icon</th>
                    <th className="text-left p-4">Blocks</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr
                      key={cat.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, cat.id)}
                      onDragOver={(e) => handleDragOver(e, cat.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, cat.id)}
                      onDragEnd={handleDragEnd}
                      className="transition-colors cursor-move"
                      style={{
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: dragOverId === cat.id ? 'rgba(99,102,241,0.15)' : draggedId === cat.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                        opacity: draggedId === cat.id ? 0.5 : 1,
                      }}
                    >
                      <td className="p-4">
                        <GripVertical className="w-4 h-4 text-white/30" />
                      </td>
                      <td className="p-4">
                        <span className={cat.disabled ? 'text-white/40 line-through' : ''}>{cat.name}</span>
                      </td>
                      <td className="p-4">{cat.icon}</td>
                      <td className="p-4">{cat.blocks?.length || 0}</td>
                      <td className="p-4">
                        {cat.disabled ? (
                          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                            Disabled
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => { setEditingCategory(cat); setShowCategoryForm(true); }}
                          className="p-2 rounded-lg mr-2 transition-colors hover:bg-white/10"
                          aria-label="Edit category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 rounded-lg transition-colors hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ color: '#f87171' }}
                          aria-label="Delete category"
                          disabled={isDeletingCategory === cat.id || isReordering}
                        >
                          {isDeletingCategory === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'blocks' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Blocks</h2>
              <button
                type="button"
                onClick={() => { setEditingBlock(null); setShowBlockForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#6366f1' }}
              >
                <Plus className="w-4 h-4" />
                Add Block
              </button>
            </div>

            <div className="rounded-xl overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <table className="w-full">
                <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <tr>
                    <th className="text-left p-4">Title</th>
                    <th className="text-left p-4">URL</th>
                    <th className="text-left p-4">Category</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block) => (
                    <tr key={block.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <td className="p-4">{block.title}</td>
                      <td className="p-4 truncate max-w-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{block.url}</td>
                      <td className="p-4">{categories.find(c => c.id === block.categoryId)?.name || 'N/A'}</td>
                      <td className="p-4">
                        {block.isMonitored ? (
                          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs"
                            style={{
                              backgroundColor: block.lastStatus === 'online' ? 'rgba(16, 185, 129, 0.2)' :
                                              block.lastStatus === 'offline' ? 'rgba(239, 68, 68, 0.2)' :
                                              'rgba(245, 158, 11, 0.2)',
                              color: block.lastStatus === 'online' ? '#34d399' :
                                     block.lastStatus === 'offline' ? '#f87171' :
                                     '#fbbf24',
                            }}>
                            {block.lastStatus || 'unknown'}
                          </span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {block.isMonitored && (
                          <button
                            type="button"
                            onClick={() => handleCheckHealth(block.id)}
                            className="p-2 rounded-lg mr-2 transition-colors hover:bg-white/10"
                            title="Check health"
                            aria-label="Check health"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { setEditingBlock(block); setShowBlockForm(true); }}
                          className="p-2 rounded-lg mr-2 transition-colors hover:bg-white/10"
                          aria-label="Edit block"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-2 rounded-lg transition-colors hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ color: '#f87171' }}
                          aria-label="Delete block"
                          disabled={isDeletingBlock === block.id}
                        >
                          {isDeletingBlock === block.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Security Settings</h2>

            {/* Password Change Section */}
            <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}>
                  <Key className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Change Password</h3>
                  <p className="text-sm text-white/60">Update your admin account password</p>
                </div>
              </div>

              {!showPasswordChange ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(true)}
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  Change Password
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm text-white/70 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full pl-4 pr-10 py-2 rounded-lg border outline-none focus:border-indigo-500"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
                        aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm text-white/70 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full pl-4 pr-10 py-2 rounded-lg border outline-none focus:border-indigo-500"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
                        aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm text-white/70 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full pl-4 pr-10 py-2 rounded-lg border outline-none focus:border-indigo-500"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(false)}
                      className="flex-1 px-4 py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: '#6366f1' }}
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* TOTP Section */}
            <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Two-Factor Authentication</h3>
                  <p className="text-sm text-white/60">
                    {authStatus?.totpEnabled
                      ? 'TOTP is currently enabled'
                      : 'Add an extra layer of security to your account'}
                  </p>
                </div>
                {authStatus?.totpEnabled && (
                  <span className="ml-auto px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                    Enabled
                  </span>
                )}
              </div>

              {!authStatus?.totpEnabled ? (
                <button
                  type="button"
                  onClick={handleSetupTOTP}
                  className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  style={{ backgroundColor: '#6366f1' }}
                >
                  <QrCode className="w-4 h-4" />
                  Setup TOTP
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDisableTOTP(true)}
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
                >
                  Disable TOTP
                </button>
              )}
            </div>

            {/* Dashboard Protection Section */}
            <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Dashboard Protection</h3>
                  <p className="text-sm text-white/60">
                    {settings.dashboardProtected
                      ? 'Dashboard is password protected'
                      : 'Dashboard is currently open to everyone'}
                  </p>
                </div>
                {settings.dashboardProtected && (
                  <span className="ml-auto px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                    Protected
                  </span>
                )}
              </div>

              {!showDashboardSettings ? (
                <button
                  type="button"
                  onClick={() => setShowDashboardSettings(true)}
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  Configure Protection
                </button>
              ) : (
                <form onSubmit={handleUpdateSettings} className="space-y-4 max-w-md">
                  <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <input
                      type="checkbox"
                      id="dashboardProtected"
                      checked={settings.dashboardProtected}
                      onChange={(e) => setSettings({ ...settings, dashboardProtected: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20"
                    />
                    <label htmlFor="dashboardProtected" className="flex-1">
                      <span className="font-medium">Enable Password Protection</span>
                      <p className="text-sm text-white/50">Require password to view the dashboard</p>
                    </label>
                  </div>

                  {settings.dashboardProtected && (
                    <div>
                      <label htmlFor="dashboardPassword" className="block text-sm text-white/70 mb-1">Dashboard Password</label>
                      <div className="relative">
                        <input
                          id="dashboardPassword"
                          type={showDashboardPassword ? "text" : "password"}
                          value={dashboardPassword}
                          onChange={(e) => setDashboardPassword(e.target.value)}
                          className="w-full pl-4 pr-10 py-2 rounded-lg border outline-none focus:border-indigo-500"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                          placeholder={settings.dashboardProtected ? 'Enter new password (leave blank to keep current)' : 'Enter password'}
                          minLength={4}
                        />
                        <button
                          type="button"
                          onClick={() => setShowDashboardPassword(!showDashboardPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
                          aria-label={showDashboardPassword ? "Hide dashboard password" : "Show dashboard password"}
                        >
                          {showDashboardPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-white/40 mt-1">Minimum 4 characters</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="durationValue" className="block text-sm text-white/70 mb-1">Session Duration</label>
                    <div className="flex gap-2">
                      <input
                        id="durationValue"
                        type="number"
                        value={durationValue}
                        onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 px-4 py-2 rounded-lg border outline-none focus:border-indigo-500"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                        min={1}
                      />
                      <select
                        aria-label="Session Duration Unit"
                        value={durationUnit}
                        onChange={(e) => setDurationUnit(e.target.value as 'hours' | 'days' | 'months')}
                        className="px-4 py-2 rounded-lg border outline-none focus:border-indigo-500"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                      >
                        <option value="hours" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Hours</option>
                        <option value="days" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Days</option>
                        <option value="months" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Months</option>
                      </select>
                    </div>
                    <p className="text-xs text-white/40 mt-1">How long users stay logged in</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowDashboardSettings(false); setDashboardPassword(''); }}
                      className="flex-1 px-4 py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: '#6366f1' }}
                    >
                      Save Settings
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Session Management Section */}
            <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                  <LogOut className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Session Management</h3>
                  <p className="text-sm text-white/60">Manage active sessions across all users</p>
                </div>
                <span className="ml-auto px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                  {activeSessions} active
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogoutAllSessions}
                className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
              >
                <LogOut className="w-4 h-4" />
                Logout All Sessions
              </button>
              <p className="text-xs text-white/40 mt-2">This will log out all users including yourself</p>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Integrations</h2>

            {/* Weather Accordion */}
            <div className="rounded-xl overflow-hidden mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div
                className="p-4 cursor-pointer flex items-center gap-3"
                onClick={() => setExpandedIntegration(expandedIntegration === 'weather' ? null : 'weather')}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                  <Cloud className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Open-Meteo Weather</h3>
                  <p className="text-sm text-white/60">Display weather information on your dashboard</p>
                </div>
                {settings.weatherEnabled && (
                  <span className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                    Enabled
                  </span>
                )}
                {expandedIntegration === 'weather' ? (
                  <ChevronUp className="w-5 h-5 text-white/40" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/40" />
                )}
              </div>

              {expandedIntegration === 'weather' && (
                <div className="px-6 pb-6">
                  <div className="space-y-4">
                {/* Enable Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <input
                    type="checkbox"
                    id="weatherEnabled"
                    checked={settings.weatherEnabled}
                    onChange={(e) => setSettings({ ...settings, weatherEnabled: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20"
                  />
                  <label htmlFor="weatherEnabled" className="flex-1">
                    <span className="font-medium">Enable Weather Display</span>
                    <p className="text-sm text-white/50">Show weather widget on the dashboard</p>
                  </label>
                </div>

                {settings.weatherEnabled && (
                  <>
                    {/* Location Settings */}
                    <div className="p-4 rounded-lg space-y-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </h4>

                      {/* Search Location */}
                      <div className="space-y-2">
                        <label className="block text-sm text-white/70">Search Location</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={locationSearchQuery}
                            onChange={(e) => setLocationSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                            placeholder="e.g., London, New York, Tokyo"
                            className="flex-1 px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                          />
                          <button
                            type="button"
                            onClick={handleLocationSearch}
                            disabled={locationSearchLoading}
                            className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                            style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}
                          >
                            {locationSearchLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              'Search'
                            )}
                          </button>
                        </div>

                        {/* Search Results */}
                        {showLocationResults && locationSearchResults.length > 0 && (
                          <div
                            className="rounded-lg overflow-hidden"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                          >
                            {locationSearchResults.map((location, index) => (
                              <button
                                type="button"
                                key={index}
                                onClick={() => handleSelectLocation(location)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                              >
                                <span className="text-white">{location.name}</span>
                                {location.admin1 && (
                                  <span className="text-white/60">, {location.admin1}</span>
                                )}
                                {location.country && (
                                  <span className="text-white/40">, {location.country}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-white/40">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>

                      {/* Get Location Button */}
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={locationLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}
                      >
                        {locationLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Getting location...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4" />
                            Use My Location
                          </>
                        )}
                      </button>

                      {locationError && (
                        <p className="text-sm" style={{ color: '#f87171' }}>{locationError}</p>
                      )}

                      {/* Manual Coordinates */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Latitude</label>
                          <input
                            type="number"
                            step="any"
                            value={settings.weatherLatitude ?? ''}
                            onChange={(e) => setSettings({ ...settings, weatherLatitude: parseFloat(e.target.value) || null })}
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                            placeholder="e.g., 51.5074"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Longitude</label>
                          <input
                            type="number"
                            step="any"
                            value={settings.weatherLongitude ?? ''}
                            onChange={(e) => setSettings({ ...settings, weatherLongitude: parseFloat(e.target.value) || null })}
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                            placeholder="e.g., -0.1278"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-white/70 mb-1">Location Name (Optional)</label>
                        <input
                          type="text"
                          value={settings.weatherLocationName || ''}
                          onChange={(e) => setSettings({ ...settings, weatherLocationName: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                          placeholder="e.g., London, New York"
                        />
                      </div>
                    </div>

                    {/* Units */}
                    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <Thermometer className="w-5 h-5 text-white/50" />
                      <div className="flex-1">
                        <label className="font-medium">Units</label>
                        <p className="text-sm text-white/50">Choose your preferred unit system</p>
                      </div>
                      <select
                        value={settings.weatherUnits}
                        onChange={(e) => setSettings({ ...settings, weatherUnits: e.target.value as 'metric' | 'imperial' })}
                        className="px-3 py-2 rounded-lg border outline-none focus:border-indigo-500"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                      >
                        <option value="metric" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Metric (°C, km/h)</option>
                        <option value="imperial" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Imperial (°F, mph)</option>
                      </select>
                    </div>

                    {/* Save Button */}
                    <button
                      type="button"
                      onClick={handleSaveWeatherSettings}
                      className="w-full px-4 py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: '#6366f1' }}
                    >
                      Save Weather Settings
                    </button>
                  </>
                )}
                  </div>
                </div>
              )}
            </div>

            {/* Traffic Accordion */}
            <div className="rounded-xl overflow-hidden mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div
                className="p-4 cursor-pointer flex items-center gap-3"
                onClick={() => setExpandedIntegration(expandedIntegration === 'traffic' ? null : 'traffic')}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <MapPin className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Traffic Information</h3>
                  <p className="text-sm text-white/60">Display commute time information on your dashboard</p>
                </div>
                {trafficSettings.enabled && (
                  <span className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                    Enabled
                  </span>
                )}
                {expandedIntegration === 'traffic' ? (
                  <ChevronUp className="w-5 h-5 text-white/40" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/40" />
                )}
              </div>

              {expandedIntegration === 'traffic' && (
                <div className="px-6 pb-6">
                  <div className="space-y-4">
                {/* Enable Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <input
                    type="checkbox"
                    id="trafficEnabled"
                    checked={trafficSettings.enabled}
                    onChange={(e) => setTrafficSettings({ ...trafficSettings, enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20"
                  />
                  <label htmlFor="trafficEnabled" className="flex-1">
                    <span className="font-medium">Enable Traffic Display</span>
                    <p className="text-sm text-white/50">Show commute time widget on the dashboard</p>
                  </label>
                </div>

                {trafficSettings.enabled && (
                  <>
                    {/* Primary Provider */}
                    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex-1">
                        <label className="font-medium">Primary Provider</label>
                        <p className="text-sm text-white/50">Which provider to use first. The other serves as fallback.</p>
                      </div>
                      <select
                        value={trafficSettings.primaryProvider}
                        onChange={(e) => setTrafficSettings({ ...trafficSettings, primaryProvider: e.target.value as 'google' | 'tomtom' })}
                        className="px-3 py-2 rounded-lg border outline-none focus:border-indigo-500"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                      >
                        <option value="google" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Google Routes</option>
                        <option value="tomtom" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>TomTom</option>
                      </select>
                    </div>

                    {/* API Keys */}
                    <div className="p-4 rounded-lg space-y-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <h4 className="font-medium flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        API Configuration
                      </h4>

                      <div>
                        <label className="block text-sm text-white/70 mb-1">
                          Google Routes API Key
                          <a
                            href="https://developers.google.com/maps/documentation/routes/get-api-key"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-xs text-blue-400 hover:underline"
                          >
                            Get API Key →
                          </a>
                        </label>
                        <div className="relative">
                          <input
                            type={showTrafficApiKey ? 'text' : 'password'}
                            value={trafficSettings.apiKey}
                            onChange={(e) => setTrafficSettings({ ...trafficSettings, apiKey: e.target.value })}
                            placeholder="Enter your Google Routes API key (optional if TomTom is configured)"
                            className="w-full pl-3 pr-10 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowTrafficApiKey(!showTrafficApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
                            aria-label={showTrafficApiKey ? "Hide Google Routes API key" : "Show Google Routes API key"}
                          >
                            {showTrafficApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-white/70 mb-1">
                          TomTom API Key
                          <a
                            href="https://developer.tomtom.com/how-to-get-tomtom-api-key"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-xs text-blue-400 hover:underline"
                          >
                            Get API Key →
                          </a>
                        </label>
                        <div className="relative">
                          <input
                            type={showTomTomApiKey ? 'text' : 'password'}
                            value={trafficSettings.tomTomApiKey}
                            onChange={(e) => setTrafficSettings({ ...trafficSettings, tomTomApiKey: e.target.value })}
                            placeholder="Enter your TomTom API key (optional if Google is configured)"
                            className="w-full pl-3 pr-10 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowTomTomApiKey(!showTomTomApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
                            aria-label={showTomTomApiKey ? "Hide TomTom API key" : "Show TomTom API key"}
                          >
                            {showTomTomApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Addresses */}
                    <div className="p-4 rounded-lg space-y-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Locations
                      </h4>

                      <div>
                        <label className="block text-sm text-white/70 mb-1">Home Address</label>
                        <input
                          type="text"
                          value={trafficSettings.homeAddress}
                          onChange={(e) => setTrafficSettings({ ...trafficSettings, homeAddress: e.target.value })}
                          placeholder="e.g., 123 Main St, New York, NY"
                          className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-white/70 mb-1">Work Address</label>
                        <input
                          type="text"
                          value={trafficSettings.workAddress}
                          onChange={(e) => setTrafficSettings({ ...trafficSettings, workAddress: e.target.value })}
                          placeholder="e.g., 456 Office Blvd, New York, NY"
                          className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                        />
                      </div>
                    </div>

                    {/* Travel Mode */}
                    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex-1">
                        <label className="font-medium">Travel Mode</label>
                        <p className="text-sm text-white/50">Choose your preferred mode of transportation</p>
                      </div>
                      <select
                        value={trafficSettings.travelMode}
                        onChange={(e) => setTrafficSettings({ ...trafficSettings, travelMode: e.target.value as typeof trafficSettings.travelMode })}
                        className="px-3 py-2 rounded-lg border outline-none focus:border-indigo-500"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                      >
                        <option value="DRIVE" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Drive</option>
                        <option value="BICYCLE" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Bicycle</option>
                        <option value="WALK" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Walk</option>
                        <option value="TWO_WHEELER" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Two Wheeler</option>
                        <option value="TRANSIT" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Transit</option>
                      </select>
                    </div>

                    {/* Units */}
                    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex-1">
                        <label className="font-medium">Units</label>
                        <p className="text-sm text-white/50">Choose your preferred unit system</p>
                      </div>
                      <select
                        value={trafficSettings.units}
                        onChange={(e) => setTrafficSettings({ ...trafficSettings, units: e.target.value as 'metric' | 'imperial' })}
                        className="px-3 py-2 rounded-lg border outline-none focus:border-indigo-500"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                      >
                        <option value="metric" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Metric (km)</option>
                        <option value="imperial" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Imperial (miles)</option>
                      </select>
                    </div>

                    {/* Save Button */}
                    <button
                      type="button"
                      onClick={handleSaveTrafficSettings}
                      className="w-full px-4 py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: '#6366f1' }}
                    >
                      Save Traffic Settings
                    </button>
                  </>
                )}
                  </div>
                </div>
              )}
            </div>

            {/* News Accordion */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div
                className="p-4 cursor-pointer flex items-center gap-3"
                onClick={() => setExpandedIntegration(expandedIntegration === 'news' ? null : 'news')}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                  <Newspaper className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">RSS News & Summarization</h3>
                  <p className="text-sm text-white/60">Fetch tech news via RSS and summarize with AI</p>
                </div>
                {newsSettings.enabled && (
                  <span className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                    Enabled
                  </span>
                )}
                {expandedIntegration === 'news' ? (
                  <ChevronUp className="w-5 h-5 text-white/40" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/40" />
                )}
              </div>

              {expandedIntegration === 'news' && (
                <div className="px-6 pb-6">
                  <div className="space-y-4">
                {/* Enable Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <input
                    type="checkbox"
                    id="newsEnabled"
                    checked={newsSettings.enabled}
                    onChange={(e) => setNewsSettings({ ...newsSettings, enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20"
                  />
                  <label htmlFor="newsEnabled" className="flex-1">
                    <span className="font-medium">Enable News Display</span>
                    <p className="text-sm text-white/50">Show AI-summarized news on the dashboard</p>
                  </label>
                </div>

                {newsSettings.enabled && (
                  <>
                    {/* API Key */}
                    <div className="p-4 rounded-lg space-y-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <h4 className="font-medium flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        MiniMax API Configuration
                      </h4>
                      <div>
                        <label className="block text-sm text-white/70 mb-1">API Key</label>
                        <div className="relative">
                          <input
                            type={showNewsApiKey ? 'text' : 'password'}
                            value={newsSettings.apiKey}
                            onChange={(e) => setNewsSettings({ ...newsSettings, apiKey: e.target.value })}
                            placeholder="Enter your MiniMax API key"
                            className="w-full pl-3 pr-10 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewsApiKey(!showNewsApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
                            aria-label={showNewsApiKey ? 'Hide API key' : 'Show API key'}
                          >
                            {showNewsApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Retention Settings */}
                    <div className="p-4 rounded-lg space-y-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <h4 className="font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Retention Settings
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Check Interval (min)</label>
                          <input
                            type="number"
                            min={5}
                            max={1440}
                            value={newsSettings.checkIntervalMinutes}
                            onChange={(e) => setNewsSettings({ ...newsSettings, checkIntervalMinutes: parseInt(e.target.value) || 60 })}
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Unread Retention (h)</label>
                          <input
                            type="number"
                            min={1}
                            max={168}
                            value={newsSettings.unreadRetentionHours}
                            onChange={(e) => setNewsSettings({ ...newsSettings, unreadRetentionHours: parseInt(e.target.value) || 24 })}
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Read Retention (h)</label>
                          <input
                            type="number"
                            min={1}
                            max={168}
                            value={newsSettings.readRetentionHours}
                            onChange={(e) => setNewsSettings({ ...newsSettings, readRetentionHours: parseInt(e.target.value) || 8 })}
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Max Article Age (h)</label>
                          <input
                            type="number"
                            min={1}
                            max={168}
                            value={newsSettings.maxArticleAgeHours}
                            onChange={(e) => setNewsSettings({ ...newsSettings, maxArticleAgeHours: parseInt(e.target.value) || 24 })}
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                          />
                          <p className="text-[10px] text-white/40 mt-1">RSS items older than this are skipped</p>
                        </div>
                      </div>
                    </div>

                    {/* Default Feeds */}
                    <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <h4 className="font-medium flex items-center gap-2">
                        <Radio className="w-4 h-4" />
                        RSS Feeds
                      </h4>
                      <div className="space-y-2">
                        {newsFeeds.map((feed) => (
                          <div key={feed.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <input
                              type="checkbox"
                              checked={feed.isEnabled}
                              onChange={(e) => handleToggleFeed(feed.id, e.target.checked)}
                              className="w-4 h-4 rounded border-white/20"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{feed.name}</p>
                              <p className="text-xs text-white/40 truncate">{feed.url}</p>
                            </div>
                            {feed.isDefault && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--theme-text-muted)' }}>
                                Default
                              </span>
                            )}
                            {!feed.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFeed(feed.id)}
                                className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Custom Feed */}
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={newFeedName}
                          onChange={(e) => setNewFeedName(e.target.value)}
                          placeholder="Feed name"
                          className="flex-1 px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                        />
                        <input
                          type="text"
                          value={newFeedUrl}
                          onChange={(e) => setNewFeedUrl(e.target.value)}
                          placeholder="RSS URL"
                          className="flex-[2] px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                        />
                        <button
                          type="button"
                          onClick={handleAddFeed}
                          className="px-3 py-2 rounded-lg transition-colors"
                          style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <h4 className="font-medium flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Monitored Topics
                      </h4>
                      <p className="text-xs text-white/40">Only show articles matching these phrases. Leave empty to show all.</p>
                      <div className="flex flex-wrap gap-2">
                        {newsTopics.map((topic) => (
                          <span
                            key={topic.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                            style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                          >
                            {topic.phrase}
                            <button
                              type="button"
                              onClick={() => handleDeleteTopic(topic.id)}
                              className="hover:text-white transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTopic}
                          onChange={(e) => setNewTopic(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                          placeholder="e.g. Microsoft Word, AI, Security"
                          className="flex-1 px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                        />
                        <button
                          type="button"
                          onClick={handleAddTopic}
                          className="px-3 py-2 rounded-lg transition-colors"
                          style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveNewsSettings}
                    className="flex-1 px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: '#6366f1' }}
                  >
                    Save News Settings
                  </button>
                  <button
                    type="button"
                    onClick={handleClearNewsCache}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:opacity-90"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--theme-text-muted)' }}
                    title="Clear in-memory news cache"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear Cache
                  </button>
                </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'general' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">General Settings</h2>

            {/* Site Identity */}
            <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}>
                  <Globe className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Site Identity</h3>
                  <p className="text-sm text-white/60">Customize your start page title and icon</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Site Title */}
                <div>
                  <label className="block text-sm text-white/70 mb-1">Site Title</label>
                  <input
                    type="text"
                    value={generalSettings.siteTitle}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                    placeholder="Start Page"
                    maxLength={100}
                  />
                  <p className="text-xs text-white/40 mt-1">This appears in the browser tab</p>
                </div>

                {/* Favicon */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Favicon</label>

                  {/* Current Favicon Preview */}
                  <div className="flex items-center gap-4 mb-3">
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {faviconPreview ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={faviconPreview}
                            alt="Favicon preview"
                            className="w-10 h-10 object-contain"
                          />
                        </>
                      ) : (
                        <span className="text-2xl">🚀</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/70">
                        {faviconPreview ? 'Custom favicon' : 'Default favicon'}
                      </p>
                      <p className="text-xs text-white/40">
                        Upload an SVG file (max 50KB)
                      </p>
                    </div>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Upload SVG</span>
                      <input
                        type="file"
                        accept=".svg,image/svg+xml"
                        onChange={handleFaviconUpload}
                        className="hidden"
                      />
                    </label>

                    {faviconPreview && (
                      <button
                        type="button"
                        onClick={handleResetFavicon}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-sm">Reset to Default</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Dashboard Theme</label>
                  <select
                    value={generalSettings.theme}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, theme: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                  >
                    {availableThemes.map((theme) => (
                      <option key={theme.id} value={theme.id} style={{ backgroundColor: '#1a1a2e', color: 'white' }}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-white/40 mt-1">Choose a color theme for your dashboard</p>
                </div>

                {/* Default View Selector */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Default Block View</label>
                  <select
                    value={generalSettings.defaultView}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, defaultView: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-500 text-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                  >
                    <option value="comfortable" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Comfortable (large cards)</option>
                    <option value="compact" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Compact (smaller cards)</option>
                    <option value="dense" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Dense (icon-focused)</option>
                    <option value="list" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>List (horizontal rows)</option>
                  </select>
                  <p className="text-xs text-white/40 mt-1">Default view mode for new visitors. Users can override this on their device.</p>
                </div>

                {/* Open in New Tab Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <input
                    type="checkbox"
                    id="openInNewTab"
                    checked={generalSettings.openInNewTab}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, openInNewTab: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20"
                  />
                  <label htmlFor="openInNewTab" className="flex-1">
                    <span className="font-medium text-sm">Open links in new tab</span>
                    <p className="text-xs text-white/50">When enabled, blocks and search results open in a new browser tab</p>
                  </label>
                </div>

                {/* Navigation Transition Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <input
                    type="checkbox"
                    id="navTransitionEnabled"
                    checked={generalSettings.navTransitionEnabled}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, navTransitionEnabled: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20"
                  />
                  <label htmlFor="navTransitionEnabled" className="flex-1">
                    <span className="font-medium text-sm">Enable navigation transition</span>
                    <p className="text-xs text-white/50">Show a visual transition when opening links in the same tab</p>
                  </label>
                </div>

                {/* Transition Type Selector (only when enabled and same-tab) */}
                {generalSettings.navTransitionEnabled && !generalSettings.openInNewTab && (
                  <div className="p-4 rounded-lg -mt-2" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <label className="block text-sm text-white/70 mb-2">Transition Style</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setGeneralSettings({ ...generalSettings, navTransitionType: 'overlay' })}
                        className="flex-1 px-4 py-3 rounded-lg text-sm text-left transition-all border"
                        style={{
                          backgroundColor: generalSettings.navTransitionType === 'overlay' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                          borderColor: generalSettings.navTransitionType === 'overlay' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.1)',
                          color: generalSettings.navTransitionType === 'overlay' ? '#818cf8' : 'white',
                        }}
                      >
                        <span className="font-medium">Launch Overlay</span>
                        <p className="text-xs mt-1" style={{ color: generalSettings.navTransitionType === 'overlay' ? '#a5b4fc' : 'rgba(255,255,255,0.4)' }}>
                          Full-screen glassmorphism overlay with icon and spinner
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGeneralSettings({ ...generalSettings, navTransitionType: 'exit' })}
                        className="flex-1 px-4 py-3 rounded-lg text-sm text-left transition-all border"
                        style={{
                          backgroundColor: generalSettings.navTransitionType === 'exit' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                          borderColor: generalSettings.navTransitionType === 'exit' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.1)',
                          color: generalSettings.navTransitionType === 'exit' ? '#818cf8' : 'white',
                        }}
                      >
                        <span className="font-medium">Exit Fade</span>
                        <p className="text-xs mt-1" style={{ color: generalSettings.navTransitionType === 'exit' ? '#a5b4fc' : 'rgba(255,255,255,0.4)' }}>
                          Darken the dashboard with a brief fade-out effect
                        </p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Transition hint when enabled but new-tab is on */}
                {generalSettings.navTransitionEnabled && generalSettings.openInNewTab && (
                  <div className="p-3 rounded-lg -mt-2 text-xs" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                    ⚠️ Navigation transitions only apply when &quot;Open links in new tab&quot; is disabled. Currently, links will still open in new tabs.
                  </div>
                )}

                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSaveGeneralSettings}
                  className="w-full px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: '#6366f1' }}
                >
                  Save General Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <>
          <EscapeHandler onEscape={closeCategoryForm} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-2xl p-6"
              role="dialog"
              aria-modal="true"
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button type="button" onClick={closeCategoryForm} className="p-1 hover:bg-white/10 rounded-lg" aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                  placeholder="e.g., Development"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">Icon</label>
                <select
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                  }}
                >
                  <option value="default" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Default</option>
                  <option value="work" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Work</option>
                  <option value="personal" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Personal</option>
                  <option value="media" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Media</option>
                  <option value="dev" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Development</option>
                  <option value="social" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Social</option>
                  <option value="shopping" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Shopping</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={categoryForm.sortOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="category-disabled"
                  checked={categoryForm.disabled || false}
                  onChange={(e) => setCategoryForm({ ...categoryForm, disabled: e.target.checked })}
                  className="w-4 h-4 rounded border-white/30 bg-white/5 text-indigo-500 focus:ring-indigo-500"
                />
                <label htmlFor="category-disabled" className="text-sm text-white/70">
                  Disabled (hidden from dashboard)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeCategoryForm}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#6366f1' }}
                >
                  {isSavingCategory && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSavingCategory ? (editingCategory ? 'Updating...' : 'Creating...') : (editingCategory ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
        </>
      )}

      {/* Block Form Modal */}
      {showBlockForm && (
        <>
          <EscapeHandler onEscape={closeBlockForm} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {editingBlock ? 'Edit Block' : 'Add Block'}
              </h3>
              <button type="button" onClick={closeBlockForm} className="p-1 hover:bg-white/10 rounded-lg" aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Title *</label>
                <input
                  type="text"
                  value={blockForm.title}
                  onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                  placeholder="e.g., GitHub"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">URL *</label>
                <input
                  type="url"
                  value={blockForm.url}
                  onChange={(e) => setBlockForm({ ...blockForm, url: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                  placeholder="https://github.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">Description</label>
                <input
                  type="text"
                  value={blockForm.description}
                  onChange={(e) => setBlockForm({ ...blockForm, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">Category *</label>
                <select
                  value={blockForm.categoryId}
                  onChange={(e) => setBlockForm({ ...blockForm, categoryId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                  }}
                  required
                >
                  <option value="" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} style={{ backgroundColor: '#1a1a2e', color: 'white' }}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">Custom Icon URL</label>
                <input
                  type="url"
                  value={blockForm.icon}
                  onChange={(e) => setBlockForm({ ...blockForm, icon: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                  placeholder="https://example.com/icon.png"
                />
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <h4 className="text-sm font-medium mb-3">Service Monitoring (Optional)</h4>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="isMonitored"
                    checked={blockForm.isMonitored}
                    onChange={(e) => setBlockForm({ ...blockForm, isMonitored: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20"
                  />
                  <label htmlFor="isMonitored" className="text-sm">Enable health monitoring</label>
                </div>

                {blockForm.isMonitored && (
                  <>
                    <div className="mb-3">
                      <label className="block text-sm text-white/70 mb-1">Health Check URL</label>
                      <input
                        type="url"
                        value={blockForm.healthCheckUrl}
                        onChange={(e) => setBlockForm({ ...blockForm, healthCheckUrl: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                        placeholder="https://api.github.com/status"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm text-white/70 mb-1">Service Type</label>
                      <input
                        type="text"
                        value={blockForm.serviceType}
                        onChange={(e) => setBlockForm({ ...blockForm, serviceType: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                        placeholder="e.g., api, website"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-white/70 mb-1">Service URL</label>
                      <input
                        type="url"
                        value={blockForm.serviceUrl}
                        onChange={(e) => setBlockForm({ ...blockForm, serviceUrl: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500"
                        placeholder="Internal service URL"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeBlockForm}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBlock}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#6366f1' }}
                >
                  {isSavingBlock && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSavingBlock ? (editingBlock ? 'Updating...' : 'Creating...') : (editingBlock ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
        </>
      )}

      {/* TOTP Setup Modal */}
      {showTOTPSetup && totpSetupData && (
        <>
          <EscapeHandler onEscape={() => { setShowTOTPSetup(false); setTotpSetupData(null); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Setup Two-Factor Authentication</h3>
              <button type="button" onClick={() => { setShowTOTPSetup(false); setTotpSetupData(null); }} className="p-1 hover:bg-white/10 rounded-lg" aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* QR Code */}
              <div className="text-center">
                <p className="text-sm text-white/70 mb-4">Scan this QR code with your authenticator app</p>
                <div className="inline-block p-4 rounded-xl" style={{ backgroundColor: 'white' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={totpSetupData.qrCode} alt="TOTP QR Code" className="w-48 h-48" />
                </div>
              </div>

              {/* Secret */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Or enter this secret manually:</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-2 rounded-lg font-mono text-sm break-all" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {totpSetupData.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(totpSetupData.secret, 'secret')}
                    className="p-2 rounded-lg transition-colors hover:bg-white/10"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    aria-label="Copy secret"
                  >
                    {copiedSecret ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Recovery Code */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: '#fbbf24' }}>
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Save this recovery code!</span>
                </div>
                <p className="text-sm text-white/70 mb-3">If you lose access to your authenticator app, use this code to recover your account. Save it somewhere safe.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-2 rounded-lg font-mono text-lg tracking-wider" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24' }}>
                    {totpSetupData.recoveryCode}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(totpSetupData.recoveryCode, 'recovery')}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}
                    aria-label="Copy recovery code"
                  >
                    {copiedRecovery ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Verification */}
              <form onSubmit={handleVerifyTOTP} className="space-y-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-sm text-white/70">Enter the 6-digit code from your authenticator app to verify:</p>
                <input
                  type="text"
                  value={totpVerificationCode}
                  onChange={(e) => setTotpVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 rounded-lg text-center text-2xl tracking-[0.5em] font-mono"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowTOTPSetup(false); setTotpSetupData(null); }}
                    className="flex-1 px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: '#6366f1' }}
                    disabled={totpVerificationCode.length !== 6}
                  >
                    Verify & Enable
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Disable TOTP Modal */}
      {showDisableTOTP && (
        <>
          <EscapeHandler onEscape={() => { setShowDisableTOTP(false); setDisableTOTPForm({ password: '', code: '' }); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-2xl p-6" role="dialog" aria-modal="true" style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-red-400">Disable Two-Factor Authentication</h3>
              <button type="button" onClick={() => { setShowDisableTOTP(false); setDisableTOTPForm({ password: '', code: '' }); }} className="p-1 hover:bg-white/10 rounded-lg" aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <p className="text-sm" style={{ color: '#f87171' }}>
                Warning: Disabling TOTP will remove the extra layer of security from your account. Make sure you want to do this.
              </p>
            </div>

            <form onSubmit={handleDisableTOTP} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showDisableTOTPPassword ? "text" : "password"}
                    value={disableTOTPForm.password}
                    onChange={(e) => setDisableTOTPForm({ ...disableTOTPForm, password: e.target.value })}
                    className="w-full pl-4 pr-10 py-2 rounded-lg border outline-none focus:border-red-500"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDisableTOTPPassword(!showDisableTOTPPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
                    aria-label={showDisableTOTPPassword ? "Hide password" : "Show password"}
                  >
                    {showDisableTOTPPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">TOTP Code or Recovery Code</label>
                <input
                  type="text"
                  value={disableTOTPForm.code}
                  onChange={(e) => setDisableTOTPForm({ ...disableTOTPForm, code: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border outline-none focus:border-red-500"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                  placeholder="6-digit code or recovery code"
                  required
                />
                <p className="text-xs text-white/50 mt-1">You can use either your authenticator code or the recovery code</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowDisableTOTP(false); setDisableTOTPForm({ password: '', code: '' }); }}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.8)' }}
                >
                  Disable TOTP
                </button>
              </div>
            </form>
          </div>
        </div>
        </>
      )}
      <ConfirmModal
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </div>
  );
}

export default memo(AdminPage);
