import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  SettingsApi,
  NOTIFICATION_LABELS,
  type NotificationPreferences,
  type NotificationChannel,
} from '../../services/admin/SettingsApi';

interface Props {
  /** Which notification event keys this role should see */
  visibleEvents: (keyof NotificationChannel)[];
}

const NotificationPreferencesCard: React.FC<Props> = ({ visibleEvents }) => {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    SettingsApi.getNotificationPreferences()
      .then((data) => setPrefs(data))
      .catch(() => {
        // use defaults on error
        const defaults: NotificationChannel = {
          proposal_endorsed: true,
          proposal_revision: true,
          fund_request_reviewed: true,
          certificate_issued: true,
          evaluator_assigned: true,
        };
        setPrefs({ email: { ...defaults }, in_app: { ...defaults } });
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (channel: 'email' | 'in_app', key: keyof NotificationChannel) => {
    if (!prefs) return;
    setPrefs({
      ...prefs,
      [channel]: {
        ...prefs[channel],
        [key]: !prefs[channel][key],
      },
    });
  };

  const handleSave = async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      const updated = await SettingsApi.updateNotificationPreferences(prefs);
      setPrefs(updated);
      Swal.fire('Saved', 'Notification preferences updated.', 'success');
    } catch {
      Swal.fire('Error', 'Failed to update notification preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!prefs) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Email Notifications */}
      <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Email Notifications</h3>
        <div className="space-y-3">
          {visibleEvents.map((key) => (
            <label key={`email-${key}`} className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.email[key]}
                onChange={() => toggle('email', key)}
                className="accent-red-600 w-4 h-4"
              />
              <span className="text-slate-700">{NOTIFICATION_LABELS[key]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">In-App Notifications</h3>
        <div className="space-y-3">
          {visibleEvents.map((key) => (
            <label key={`in_app-${key}`} className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.in_app[key]}
                onChange={() => toggle('in_app', key)}
                className="accent-red-600 w-4 h-4"
              />
              <span className="text-slate-700">{NOTIFICATION_LABELS[key]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="md:col-span-2 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50 bg-red-600 hover:bg-red-700"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferencesCard;
