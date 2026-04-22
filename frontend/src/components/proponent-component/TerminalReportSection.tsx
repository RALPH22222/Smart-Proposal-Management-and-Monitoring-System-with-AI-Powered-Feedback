import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, Upload, X, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import {
  fetchTerminalReport,
  submitTerminalReport,
  fetchBudgetSummary,
  uploadReportFile,
  validateReportFile,
  REPORT_ALLOWED_EXTENSIONS,
  type ApiTerminalReport,
  type ApiBudgetSummary,
} from '../../services/ProjectMonitoringApi';

interface Props {
  fundedProjectId: number;
  allQuartersVerified: boolean;
}

export default function TerminalReportSection({ fundedProjectId, allQuartersVerified }: Props) {
  const [terminalReport, setTerminalReport] = useState<ApiTerminalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [actualStartDate, setActualStartDate] = useState('');
  const [actualEndDate, setActualEndDate] = useState('');
  const [accomplishments, setAccomplishments] = useState('');
  const [outputsPublications, setOutputsPublications] = useState('');
  const [outputsPatentsIp, setOutputsPatentsIp] = useState('');
  const [outputsProducts, setOutputsProducts] = useState('');
  const [outputsPeople, setOutputsPeople] = useState('');
  const [outputsPartnerships, setOutputsPartnerships] = useState('');
  const [outputsPolicy, setOutputsPolicy] = useState('');
  const [problemsEncountered, setProblemsEncountered] = useState('');
  const [suggestedSolutions, setSuggestedSolutions] = useState('');
  const [publicationsList, setPublicationsList] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  // Financial reconciliation: proponent's declared surrender of unexpended balance.
  // Certificate won't issue unless (spent + surrendered) ≈ allocated.
  const [surrenderedAmount, setSurrenderedAmount] = useState<string>('');
  const [budgetSummary, setBudgetSummary] = useState<ApiBudgetSummary | null>(null);

  useEffect(() => {
    if (!allQuartersVerified) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetchTerminalReport(fundedProjectId).catch(() => null),
      fetchBudgetSummary(fundedProjectId).catch(() => null),
    ])
      .then(([tr, bs]) => {
        if (tr) setTerminalReport(tr);
        if (bs) {
          setBudgetSummary(bs);
          // Prefill the surrender with the computed unexpended balance so the common
          // case (surrender all remaining) is one click. Proponent can override if
          // they're planning to spend more before closeout.
          const remaining = Math.max(0, bs.total_budget - bs.total_actual_spent);
          if (remaining > 0) {
            setSurrenderedAmount(remaining.toFixed(2));
          }
        }
      })
      .finally(() => setLoading(false));
  }, [fundedProjectId, allQuartersVerified]);

  if (!allQuartersVerified || loading) return null;

  // Derived surrender validation — also used to drive the submit button's
  // disabled state so a known-bad value can't reach the server.
  const surrenderValue = parseFloat(surrenderedAmount) || 0;
  const unexpendedFromSummary = budgetSummary
    ? Math.max(0, budgetSummary.total_budget - budgetSummary.total_actual_spent)
    : 0;
  const surrenderExceedsUnexpended =
    !!budgetSummary && surrenderValue > unexpendedFromSummary + 0.01;
  const persistedSurrenderValue = Number(terminalReport?.surrendered_amount ?? 0) || 0;
  const persistedReconciliationGap =
    budgetSummary && terminalReport
      ? budgetSummary.total_budget - (budgetSummary.total_actual_spent + persistedSurrenderValue)
      : null;
  const verifiedCertificateBlocked =
    terminalReport?.status === 'verified' &&
    typeof persistedReconciliationGap === 'number' &&
    persistedReconciliationGap > 0.01;

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    for (const f of newFiles) {
      const err = validateReportFile(f);
      if (err) {
        Swal.fire('Invalid File', err, 'error');
        return;
      }
    }
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    const trimmedAccomplishments = accomplishments.trim();
    if (trimmedAccomplishments.length < 10) {
      Swal.fire(
        'Too short',
        `Accomplishments must be at least 10 characters (currently ${trimmedAccomplishments.length}).`,
        'warning',
      );
      return;
    }

    if (surrenderExceedsUnexpended) {
      Swal.fire(
        'Over-surrender',
        `You're declaring ₱${surrenderValue.toFixed(2)} to surrender, but the unexpended balance is only ₱${unexpendedFromSummary.toFixed(2)}. Lower the surrender amount to the unexpended balance (or less).`,
        'warning',
      );
      return;
    }

    setSubmitting(true);
    try {
      // Upload files first
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const url = await uploadReportFile(file);
        uploadedUrls.push(url);
      }

      const parsedSurrender = parseFloat(surrenderedAmount) || 0;

      const result = await submitTerminalReport({
        fundedProjectId,
        actualStartDate: actualStartDate || undefined,
        actualEndDate: actualEndDate || undefined,
        accomplishments,
        outputsPublications: outputsPublications || undefined,
        outputsPatentsIp: outputsPatentsIp || undefined,
        outputsProducts: outputsProducts || undefined,
        outputsPeople: outputsPeople || undefined,
        outputsPartnerships: outputsPartnerships || undefined,
        outputsPolicy: outputsPolicy || undefined,
        problemsEncountered: problemsEncountered || undefined,
        suggestedSolutions: suggestedSolutions || undefined,
        publicationsList: publicationsList || undefined,
        reportFileUrl: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        surrenderedAmount: parsedSurrender,
      });

      setTerminalReport(result);
      setShowForm(false);
      Swal.fire('Submitted', 'Terminal report submitted successfully.', 'success');
    } catch (err: any) {
      const body = err?.response?.data;
      const zodMsg = Array.isArray(body?.data) ? body.data[0]?.message : undefined;
      const msg = zodMsg || body?.message || 'Failed to submit terminal report.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Already submitted — show status. Three sub-states: verified / submitted (pending) / rejected.
  // When rejected we open the full edit form pre-populated with the proponent's last values
  // so they can fix what R&D flagged and resubmit. On resubmit the backend flips status back
  // to 'submitted' via the UPDATE-in-place path in submitTerminalReport.
  if (terminalReport && !showForm) {
    const isVerified = terminalReport.status === 'verified';
    const isRejected = terminalReport.status === 'rejected';

    const openEditForm = () => {
      setActualStartDate(terminalReport.actual_start_date ?? '');
      setActualEndDate(terminalReport.actual_end_date ?? '');
      setAccomplishments(terminalReport.accomplishments ?? '');
      setOutputsPublications(terminalReport.outputs_publications ?? '');
      setOutputsPatentsIp(terminalReport.outputs_patents_ip ?? '');
      setOutputsProducts(terminalReport.outputs_products ?? '');
      setOutputsPeople(terminalReport.outputs_people ?? '');
      setOutputsPartnerships(terminalReport.outputs_partnerships ?? '');
      setOutputsPolicy(terminalReport.outputs_policy ?? '');
      setProblemsEncountered(terminalReport.problems_encountered ?? '');
      setSuggestedSolutions(terminalReport.suggested_solutions ?? '');
      setPublicationsList(terminalReport.publications_list ?? '');
      setShowForm(true);
    };

    const containerClass = isVerified
      ? 'border-green-200 bg-green-50'
      : isRejected
        ? 'border-red-200 bg-red-50'
        : 'border-amber-200 bg-amber-50';

    return (
      <div className={`rounded-2xl border-2 p-6 ${containerClass}`}>
        <div className="flex items-center gap-3 mb-4">
          {isVerified ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : isRejected ? (
            <AlertTriangle className="w-6 h-6 text-red-600" />
          ) : (
            <Clock className="w-6 h-6 text-amber-600" />
          )}
          <h3 className="text-lg font-bold text-gray-800">
            Terminal Report {isVerified
              ? '— Verified'
              : isRejected
                ? '— Returned for Revision'
                : '— Pending Verification'}
          </h3>
        </div>

        {isRejected && (
          <div className="mb-4 border border-red-200 bg-white rounded-lg p-3">
            <p className="text-sm font-bold text-red-800 mb-1">R&D returned this report</p>
            {terminalReport.review_note ? (
              <p className="text-sm text-red-700 italic">"{terminalReport.review_note}"</p>
            ) : (
              <p className="text-xs text-red-600 italic">No reason recorded.</p>
            )}
            <button
              onClick={openEditForm}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold rounded-lg text-xs flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5" /> Edit and Resubmit
            </button>
          </div>
        )}

        <div className="space-y-3 text-sm text-gray-700">
          {terminalReport.actual_start_date && (
            <p><span className="font-semibold">Actual Duration:</span> {terminalReport.actual_start_date} to {terminalReport.actual_end_date}</p>
          )}
          <div>
            <p className="font-semibold mb-1">Accomplishments Against Objectives:</p>
            <p className="whitespace-pre-wrap bg-white/60 rounded-lg p-3">{terminalReport.accomplishments}</p>
          </div>

          {/* 6Ps Section */}
          {(terminalReport.outputs_publications || terminalReport.outputs_patents_ip || terminalReport.outputs_products || terminalReport.outputs_people || terminalReport.outputs_partnerships || terminalReport.outputs_policy) && (
            <div>
              <p className="font-semibold mb-2">Outputs (6Ps):</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {terminalReport.outputs_publications && <div className="bg-white/60 rounded-lg p-2"><span className="font-medium text-xs uppercase text-gray-500">Publications</span><p className="mt-1">{terminalReport.outputs_publications}</p></div>}
                {terminalReport.outputs_patents_ip && <div className="bg-white/60 rounded-lg p-2"><span className="font-medium text-xs uppercase text-gray-500">Patents/IP</span><p className="mt-1">{terminalReport.outputs_patents_ip}</p></div>}
                {terminalReport.outputs_products && <div className="bg-white/60 rounded-lg p-2"><span className="font-medium text-xs uppercase text-gray-500">Products</span><p className="mt-1">{terminalReport.outputs_products}</p></div>}
                {terminalReport.outputs_people && <div className="bg-white/60 rounded-lg p-2"><span className="font-medium text-xs uppercase text-gray-500">People Services</span><p className="mt-1">{terminalReport.outputs_people}</p></div>}
                {terminalReport.outputs_partnerships && <div className="bg-white/60 rounded-lg p-2"><span className="font-medium text-xs uppercase text-gray-500">Places & Partnerships</span><p className="mt-1">{terminalReport.outputs_partnerships}</p></div>}
                {terminalReport.outputs_policy && <div className="bg-white/60 rounded-lg p-2"><span className="font-medium text-xs uppercase text-gray-500">Policy</span><p className="mt-1">{terminalReport.outputs_policy}</p></div>}
              </div>
            </div>
          )}

          {terminalReport.problems_encountered && (
            <div><p className="font-semibold mb-1">Problems Encountered:</p><p className="whitespace-pre-wrap bg-white/60 rounded-lg p-3">{terminalReport.problems_encountered}</p></div>
          )}
          {terminalReport.suggested_solutions && (
            <div><p className="font-semibold mb-1">Suggested Solutions:</p><p className="whitespace-pre-wrap bg-white/60 rounded-lg p-3">{terminalReport.suggested_solutions}</p></div>
          )}
          {terminalReport.publications_list && (
            <div><p className="font-semibold mb-1">Publications List:</p><p className="whitespace-pre-wrap bg-white/60 rounded-lg p-3">{terminalReport.publications_list}</p></div>
          )}
        </div>

        {isVerified && terminalReport.verified_by_user && (
          <>
            {verifiedCertificateBlocked && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Terminal report verified, but the completion certificate is still blocked until the remaining
                {' '}₱{persistedReconciliationGap!.toFixed(2)} budget gap is reconciled.
              </div>
            )}
            <p className="mt-4 text-xs text-green-700">
              Verified by {terminalReport.verified_by_user.first_name} {terminalReport.verified_by_user.last_name} on {new Date(terminalReport.verified_at!).toLocaleDateString()}
            </p>
          </>
        )}
      </div>
    );
  }

  // Not yet submitted — show form or prompt
  if (!showForm) {
    return (
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Final Project Completion Report Required</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          All quarterly reports have been verified. Please submit a terminal report (DOST Form 9A) before a completion certificate can be issued.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm"
        >
          Submit Terminal Report
        </button>
      </div>
    );
  }

  // Form
  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-800">Final Project Completion Report</h3>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Use this closeout form to summarize the completed work, final outputs, issues encountered,
            supporting evidence, and budget reconciliation for DOST Form 9A.
          </p>
        </div>
        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-5">
        {/* Actual Duration */}
        <div>
          <p className="mb-3 text-[11px] leading-relaxed text-gray-500">
            Enter the real project start and end dates if implementation changed from the original plan.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Actual Start Date</label>
              <input type="date" value={actualStartDate} onChange={(e) => setActualStartDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Actual End Date</label>
              <input type="date" value={actualEndDate} onChange={(e) => setActualEndDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Accomplishments */}
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Accomplishments Against Objectives <span className="text-red-500">*</span></label>
          <p className="mb-2 text-[11px] leading-relaxed text-gray-500">
            Give the panel a concise final summary of what the project actually achieved compared with its stated objectives.
          </p>
          <textarea value={accomplishments} onChange={(e) => setAccomplishments(e.target.value)} placeholder="Describe accomplishments relative to stated objectives..." className="w-full p-3 border border-gray-300 rounded-xl text-sm h-28 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
          <p className={`text-[11px] mt-1 ${accomplishments.trim().length < 10 ? 'text-amber-600' : 'text-gray-500'}`}>
            {accomplishments.trim().length < 10
              ? `Minimum 10 characters required (${accomplishments.trim().length}/10).`
              : `${accomplishments.trim().length} characters.`}
          </p>
        </div>

        {/* 6Ps Outputs */}
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Final Outputs — 6Ps (DOST Impact Metrics)</label>
          <p className="mb-3 text-[11px] leading-relaxed text-gray-500">
            Fill in only the output categories that apply. This section captures the concrete end-results of the project, such as publications, products, partnerships, or policy contributions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Publications</label>
              <textarea value={outputsPublications} onChange={(e) => setOutputsPublications(e.target.value)} placeholder="Papers, articles, proceedings..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Patents / Intellectual Property</label>
              <textarea value={outputsPatentsIp} onChange={(e) => setOutputsPatentsIp(e.target.value)} placeholder="Patents filed, utility models..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Products</label>
              <textarea value={outputsProducts} onChange={(e) => setOutputsProducts(e.target.value)} placeholder="Technologies, prototypes, tools..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">People Services</label>
              <textarea value={outputsPeople} onChange={(e) => setOutputsPeople(e.target.value)} placeholder="Training, capacity building, HR..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Places & Partnerships</label>
              <textarea value={outputsPartnerships} onChange={(e) => setOutputsPartnerships(e.target.value)} placeholder="Collaborations, community impact..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Policy</label>
              <textarea value={outputsPolicy} onChange={(e) => setOutputsPolicy(e.target.value)} placeholder="Policy recommendations, frameworks..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Problems & Solutions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Problems Encountered</label>
            <p className="mb-2 text-[11px] leading-relaxed text-gray-500">
              Summarize the major implementation issues, delays, or constraints that affected project delivery.
            </p>
            <textarea value={problemsEncountered} onChange={(e) => setProblemsEncountered(e.target.value)} placeholder="Challenges during implementation..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Suggested Solutions</label>
            <p className="mb-2 text-[11px] leading-relaxed text-gray-500">
              Note how the issues were addressed or what you recommend for future implementation.
            </p>
            <textarea value={suggestedSolutions} onChange={(e) => setSuggestedSolutions(e.target.value)} placeholder="Recommendations for future..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        {/* Publications List */}
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Publications List</label>
          <p className="mb-2 text-[11px] leading-relaxed text-gray-500">
            Provide full citations or a clean list of output references if the project produced publishable materials.
          </p>
          <textarea value={publicationsList} onChange={(e) => setPublicationsList(e.target.value)} placeholder="List all resulting publications with full citations..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        {/* Financial Reconciliation — certificate can't issue unless the books balance */}
        {budgetSummary && (() => {
          const allocated = budgetSummary.total_budget;
          const spent = budgetSummary.total_actual_spent;
          const surrender = parseFloat(surrenderedAmount) || 0;
          const unexpended = Math.max(0, allocated - spent);
          const reconciled = spent + surrender;
          const gap = allocated - reconciled;
          const balances = Math.abs(gap) <= 0.01;
          const overSurrender = surrender > unexpended + 0.01;
          return (
            <div className={`border-2 rounded-xl p-4 ${balances ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <FileText className={`w-5 h-5 ${balances ? 'text-emerald-600' : 'text-amber-600'}`} />
                <h4 className={`font-bold text-sm ${balances ? 'text-emerald-800' : 'text-amber-800'}`}>
                  Financial Reconciliation
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                The certificate can only be issued when spent + surrendered equals the allocated total.
                Declare any unexpended balance you'll return to the agency below.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Allocated</p>
                  <p className="font-bold text-slate-800 mt-1">
                    ₱{allocated.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wide">Spent</p>
                  <p className="font-bold text-blue-700 mt-1">
                    ₱{spent.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-purple-600 tracking-wide">Surrendering</p>
                  <p className="font-bold text-purple-700 mt-1">
                    ₱{surrender.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`rounded-lg p-2.5 border ${balances ? 'bg-emerald-100 border-emerald-300' : 'bg-amber-100 border-amber-300'}`}>
                  <p className={`text-[10px] uppercase font-bold tracking-wide ${balances ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {balances ? 'Balanced' : 'Gap'}
                  </p>
                  <p className={`font-bold mt-1 ${balances ? 'text-emerald-800' : 'text-amber-800'}`}>
                    ₱{gap.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Surrender declaration <span className="text-gray-400 font-normal">(unexpended balance returned to agency)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold">₱</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={surrenderedAmount}
                    onChange={(e) => setSurrenderedAmount(e.target.value)}
                    max={unexpended}
                    step="0.01"
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSurrenderedAmount(unexpended.toFixed(2))}
                    className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-[11px] font-bold rounded-lg whitespace-nowrap"
                    title={`Fill in the full unexpended balance (₱${unexpended.toFixed(2)})`}
                  >
                    Surrender all unexpended
                  </button>
                </div>
                {overSurrender && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Can't surrender more than the unexpended balance (₱{unexpended.toFixed(2)}).
                  </p>
                )}
                {!balances && !overSurrender && gap > 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    The books don't balance yet — ₱{gap.toFixed(2)} is unaccounted for. R&D will block certificate issuance until this is zero.
                  </p>
                )}
                {balances && (
                  <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Books balance. Certificate can be issued after R&D verifies this terminal report.
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* File Upload */}
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Supporting Documents</label>
          <p className="mb-2 text-[11px] leading-relaxed text-gray-500">
            Attach proof files for the final report, such as signed forms, summary documents, photos, publications, or other completion evidence.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {files.map((f, i) => (
              <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full">
                {f.name}
                <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            ))}
            <label className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-full cursor-pointer transition-colors">
              <Upload className="w-3 h-3" /> Add File
              <input type="file" className="hidden" accept={REPORT_ALLOWED_EXTENSIONS} onChange={handleFileAdd} multiple />
            </label>
          </div>
        </div>

        {/* Submit — also blocked when MOA / Agency Cert missing. */}
        <button
          onClick={handleSubmit}
          disabled={submitting || accomplishments.trim().length < 10 || surrenderExceedsUnexpended}
          title={
            surrenderExceedsUnexpended
              ? `Surrender (₱${surrenderValue.toFixed(2)}) exceeds the unexpended balance (₱${unexpendedFromSummary.toFixed(2)})`
              : undefined
          }
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
        >
          {submitting ? 'Submitting...' : 'Submit Terminal Report'}
        </button>
      </div>
    </div>
  );
}
