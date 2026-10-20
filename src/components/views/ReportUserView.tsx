import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Send, 
  CheckCircle, 
  UserX, 
  Car, 
  HelpCircle, 
  ArrowLeft,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createReport } from '../../services/reportService';
import { ReportReason } from '../../types';

interface ReportUserViewProps {
  initialReportedUserId?: string;
  initialReportedUserName?: string;
  initialRideId?: string;
  onBack: () => void;
  onSubmitSuccess: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string; desc: string }[] = [
  { value: 'unsafe_driving', label: 'Unsafe / Reckless Driving', desc: 'Driver exceeded speed limits or exhibited dangerous behavior.' },
  { value: 'no_show', label: 'No-Show / Unannounced Absence', desc: 'Driver or passenger failed to arrive at the agreed pickup point.' },
  { value: 'harassment', label: 'Harassment or Inappropriate Behavior', desc: 'Verbal, discriminatory, or hostile communication.' },
  { value: 'incorrect_vehicle', label: 'Mismatched / Unregistered Vehicle', desc: 'Vehicle model, plate, or driver was different from the app profile.' },
  { value: 'payment_issue', label: 'Fare / Pricing Dispute', desc: 'Demanded cash outside the agreed RouteMate platform fare.' },
  { value: 'other', label: 'Other Safety Concern', desc: 'Any other violation of RouteMate community safety guidelines.' },
];

export const ReportUserView: React.FC<ReportUserViewProps> = ({
  initialReportedUserId = '',
  initialReportedUserName = '',
  initialRideId = '',
  onBack,
  onSubmitSuccess
}) => {
  const { user, profile } = useAuth();
  
  const [reportedUserId, setReportedUserId] = useState(initialReportedUserId);
  const [reportedUserName, setReportedUserName] = useState(initialReportedUserName);
  const [rideId, setRideId] = useState(initialRideId);
  const [reason, setReason] = useState<ReportReason>('unsafe_driving');
  const [description, setDescription] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to submit a safety report.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide detailed information about the incident.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await createReport(
        user.uid,
        profile?.displayName || 'Anonymous Reporter',
        reportedUserId.trim() || 'unknown_target',
        reportedUserName.trim() || 'Reported Party',
        rideId.trim() || undefined,
        reason,
        description.trim()
      );

      onSubmitSuccess();
    } catch (err: any) {
      console.error('Error submitting safety report:', err);
      setError(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Go Back</span>
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold font-display text-slate-950 dark:text-white">
              Report a User or Safety Incident
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              We take safety and platform integrity seriously. All reports are logged directly to the admin moderation queue for immediate review.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Target User Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Reported User Name or Identifier
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Jane Driver / User UID"
                value={reportedUserName}
                onChange={(e) => setReportedUserName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Related Ride ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., ride_123456"
                value={rideId}
                onChange={(e) => setRideId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Reason Radio List */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Primary Reason for Report
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    reason === r.value
                      ? 'bg-red-500/5 dark:bg-red-950/20 border-red-500/40 ring-1 ring-red-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="mt-1 accent-red-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{r.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Incident Description & Details *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, location, time, and any specifics for our trust & safety team..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Safety Report to Moderation</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
