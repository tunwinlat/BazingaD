'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { LayoutGrid, Plus, Trash2, Save, ToggleLeft, ToggleRight, Key, ArrowRight, ArrowLeft } from 'lucide-react';

export type GadgetType = 'password';

interface GadgetConfig {
  type: GadgetType;
  id: string;
  side: 'left' | 'right';
}

interface GadgetSettings {
  leftEnabled: boolean;
  rightEnabled: boolean;
  leftConfig: GadgetConfig[];
  rightConfig: GadgetConfig[];
}

const GADGET_TYPES: { type: GadgetType; label: string; icon: React.ReactNode }[] = [
  { type: 'password', label: 'Password Generator', icon: <Key className="w-4 h-4" /> },
];

export default function GadgetSettingsPanel() {
  const [settings, setSettings] = useState<GadgetSettings>({
    leftEnabled: false,
    rightEnabled: false,
    leftConfig: [],
    rightConfig: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/gadgets');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          leftEnabled: data.leftEnabled ?? false,
          rightEnabled: data.rightEnabled ?? false,
          leftConfig: data.leftConfig ?? [],
          rightConfig: data.rightConfig ?? [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch gadget settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/gadgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gadgetBarLeftEnabled: settings.leftEnabled,
          gadgetBarRightEnabled: settings.rightEnabled,
          gadgetBarLeftConfig: settings.leftConfig,
          gadgetBarRightConfig: settings.rightConfig,
        }),
      });
      if (res.ok) {
        toast.success('Gadget settings saved');
      } else {
        toast.error('Failed to save gadget settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const addGadget = (side: 'left' | 'right', type: GadgetType) => {
    const newGadget: GadgetConfig = { type, id: `${type}-${Date.now()}`, side };
    setSettings((prev) => ({
      ...prev,
      [side === 'left' ? 'leftConfig' : 'rightConfig']: [
        ...(side === 'left' ? prev.leftConfig : prev.rightConfig),
        newGadget,
      ],
    }));
  };

  const removeGadget = (side: 'left' | 'right', id: string) => {
    setSettings((prev) => ({
      ...prev,
      [side === 'left' ? 'leftConfig' : 'rightConfig']:
        (side === 'left' ? prev.leftConfig : prev.rightConfig).filter((g) => g.id !== id),
    }));
  };

  const moveGadget = (side: 'left' | 'right', index: number, direction: 'up' | 'down') => {
    const arr = side === 'left' ? [...settings.leftConfig] : [...settings.rightConfig];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= arr.length) return;
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    setSettings((prev) => ({
      ...prev,
      [side === 'left' ? 'leftConfig' : 'rightConfig']: arr,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#6366f1' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Gadget Bars
          </h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Configure retractable gadget panels on the dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#6366f1' }}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Bar */}
        <BarConfig
          title="Left Bar"
          enabled={settings.leftEnabled}
          onToggle={() => setSettings((p) => ({ ...p, leftEnabled: !p.leftEnabled }))}
          gadgets={settings.leftConfig}
          onAdd={(type) => addGadget('left', type)}
          onRemove={(id) => removeGadget('left', id)}
          onMove={(i, d) => moveGadget('left', i, d)}
        />

        {/* Right Bar */}
        <BarConfig
          title="Right Bar"
          enabled={settings.rightEnabled}
          onToggle={() => setSettings((p) => ({ ...p, rightEnabled: !p.rightEnabled }))}
          gadgets={settings.rightConfig}
          onAdd={(type) => addGadget('right', type)}
          onRemove={(id) => removeGadget('right', id)}
          onMove={(i, d) => moveGadget('right', i, d)}
        />
      </div>
    </div>
  );
}

function BarConfig({
  title,
  enabled,
  onToggle,
  gadgets,
  onAdd,
  onRemove,
  onMove,
}: {
  title: string;
  enabled: boolean;
  onToggle: () => void;
  gadgets: GadgetConfig[];
  onAdd: (type: GadgetType) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all hover:scale-105"
          style={{
            backgroundColor: enabled ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
            color: enabled ? '#34d399' : 'rgba(255,255,255,0.4)',
            border: `1px solid ${enabled ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          {enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {enabled && (
        <div className="space-y-2">
          {gadgets.length === 0 && (
            <p className="text-sm py-4 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No gadgets configured. Add one below.
            </p>
          )}

          {gadgets.map((gadget, index) => {
            const typeInfo = GADGET_TYPES.find((t) => t.type === gadget.type);
            return (
              <div
                key={gadget.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => onMove(index, 'up')}
                    disabled={index === 0}
                    className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20"
                  >
                    <ArrowRight className="w-3 h-3 -rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(index, 'down')}
                    disabled={index === gadgets.length - 1}
                    className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20"
                  >
                    <ArrowRight className="w-3 h-3 rotate-90" />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  {typeInfo?.icon}
                  <span className="text-sm">{typeInfo?.label || gadget.type}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(gadget.id)}
                  className="p-1.5 rounded-md hover:bg-red-500/20 transition-colors"
                  style={{ color: '#f87171' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {/* Add gadget */}
          <div className="relative pt-2">
            <button
              type="button"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
              style={{ border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
            >
              <Plus className="w-4 h-4" />
              Add Gadget
            </button>

            {showAddMenu && (
              <div
                className="absolute left-0 right-0 mt-1 rounded-lg overflow-hidden z-10"
                style={{
                  backgroundColor: 'rgba(25,25,40,0.98)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}
              >
                {GADGET_TYPES.map((gt) => (
                  <button
                    key={gt.type}
                    type="button"
                    onClick={() => {
                      onAdd(gt.type);
                      setShowAddMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left hover:bg-white/5 transition-colors"
                  >
                    {gt.icon}
                    {gt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
