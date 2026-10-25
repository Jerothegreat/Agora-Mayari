'use client';

import AppHeader from '@/components/AppHeader';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Alert,
  AnomalySignal,
  DashboardSummary,
  generateIntelligence,
  getActiveAlerts,
  getAnomalySignals,
  getByRegion,
  getDashboardSummary,
  getTopSymptoms,
  getTrend,
  RegionStat,
  TopSymptom,
  TrendData,
} from '@/lib/api';
import { buildPublicHealthBrief, getPhilippineRegionCoords, getPriorityClasses, getSignalToneClasses } from '@/lib/publicHealthIntelligence';
import { buildPublicHealthDemoDataset } from '@/lib/publicHealthDemoData';
import { mainNavItems } from '@/lib/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Brain,
  Clock,
  Map as MapIcon,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import React, { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false },
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false },
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false },
);

type FeedbackTone = 'success' | 'error' | 'info';

type FeedbackState = {
  tone: FeedbackTone;
  message: string;
};

const feedbackStyles: Record<FeedbackTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-teal-200 bg-teal-50 text-teal-700',
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Unable to load the intelligence feed right now.';
};

const formatVelocity = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

const formatLastUpdated = (date: Date | null, language: 'English' | 'Filipino') => {
  if (!date) {
    return language === 'Filipino' ? 'Waiting for first sync' : 'Waiting for first sync';
  }

  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export default function PublicHealthCommandCenter() {
  const { language } = useLanguage();
  const copy = {
    English: {
      badge: 'PUBLIC HEALTH SURVEILLANCE',
      title: 'Public Health Intelligence Dashboard',
      subtitle: 'Translate triage reports into regional watchlists, anomaly signals, and operational response briefs for health teams.',
      runAnalysis: 'Generate Situation Brief',
      refresh: 'Refresh Feed',
      liveFeed: 'Updated every 60 seconds',
      reports24h: 'Reports (24h)',
      signalVelocity: 'Signal Velocity',
      hotspotWatch: 'Hotspots on Watch',
      activeAlerts: 'Active Alerts',
      liveBrief: 'Situation Brief',
      actionBoard: 'Response Coordination',
      mapTitle: 'Regional Signal Map',
      mapHint: 'Bubble size reflects report density. Color reflects average urgency.',
      trendTitle: '14-Day Signal Trend',
      watchlistTitle: 'Regional Watchlist',
      symptomsTitle: 'Top Symptom Signals',
      tableTitle: 'Regional Signal Table',
      tableRegion: 'Region',
      tableReports: 'Reports',
      tableUrgency: 'Avg Urgency',
      tableStatus: 'Status',
      emptyData: 'No recent triage data yet. Submit a symptom check to start the intelligence feed.',
      refreshed: 'Dashboard feed refreshed.',
      analysisDone: 'AI outbreak analysis completed.',
      analysisNoAlerts: 'AI analysis completed. No new outbreak alerts were generated.',
      loading: 'Loading live intelligence...',
      retryHint: 'Make sure the backend API is running and the database is reachable.',
      watchlistLabel: 'Signal score',
      lastUpdated: 'Last sync',
      dominantSignal: 'Dominant signal',
      signalScore: 'National Signal Score',
      updatedNow: 'Live now',
      priorityHigh: 'High priority',
      priorityMedium: 'Medium priority',
      priorityLow: 'Low priority',
      statusCritical: 'Critical',
      statusElevated: 'Elevated',
      statusStable: 'Stable',
      popupReports: 'Reports',
      popupUrgency: 'Avg urgency',
      popupStatus: 'Status',
      anomalyTitle: 'Outbreak Anomaly Engine',
      anomalyHint: 'Statistical baselines compare the last 48 hours against the prior 14 days before AI drafts alerts.',
      anomalyEmpty: 'No statistically significant anomaly is active right now.',
      confidence: 'Confidence',
      spike: 'Spike',
      zScore: 'Z-score',
      dataSource: 'Data source',
      coverageWindow: 'Coverage window',
      aggregationLevel: 'Aggregation level',
      liveMode: 'Live operational feed',
      syntheticMode: 'Synthetic demo feed',
      syntheticNotice: 'Showing a synthesized sentinel dataset for demonstration. No real patients are represented.',
      emptyFeedNotice: 'No live reports were returned, so Mayari loaded a synthesized sentinel dataset for demonstration.',
      apiFallbackNotice: 'The live public-health API is unavailable, so Mayari loaded a synthesized sentinel dataset for demonstration.',
      methodologyTitle: 'Methodology and privacy guardrails',
      methodologyBody: 'Signals are aggregated by region and symptom cluster. Patient identifiers are not shown in this dashboard, and demo mode uses generated records only.',
    },
    Filipino: {
      badge: 'PUBLIC HEALTH SURVEILLANCE',
      title: 'Public Health Intelligence Dashboard',
      subtitle: 'Gawing regional watchlists, anomaly signals, at response briefs ang triage reports para sa health teams.',
      runAnalysis: 'Gumawa ng Situation Brief',
      refresh: 'I-refresh ang Feed',
      liveFeed: 'Nagre-refresh kada 60 segundo',
      reports24h: 'Mga Ulat (24h)',
      signalVelocity: 'Signal Velocity',
      hotspotWatch: 'Mga Hotspot',
      activeAlerts: 'Aktibong Alerts',
      liveBrief: 'Situation Brief',
      actionBoard: 'Response Coordination',
      mapTitle: 'Regional Signal Map',
      mapHint: 'Ang laki ng bubble ay batay sa dami ng ulat. Ang kulay ay batay sa urgency.',
      trendTitle: '14-Day Signal Trend',
      watchlistTitle: 'Regional Watchlist',
      symptomsTitle: 'Top Symptom Signals',
      tableTitle: 'Regional Signal Table',
      tableRegion: 'Rehiyon',
      tableReports: 'Mga Ulat',
      tableUrgency: 'Avg Urgency',
      tableStatus: 'Status',
      emptyData: 'Wala pang recent triage data. Mag-submit ng symptom check para simulan ang intelligence feed.',
      refreshed: 'Na-refresh ang dashboard feed.',
      analysisDone: 'Tapos na ang AI outbreak analysis.',
      analysisNoAlerts: 'Tapos na ang AI analysis. Walang bagong outbreak alerts na nabuo.',
      loading: 'Niloload ang live intelligence...',
      retryHint: 'Siguraduhing tumatakbo ang backend API at naaabot ang database.',
      watchlistLabel: 'Signal score',
      lastUpdated: 'Huling sync',
      dominantSignal: 'Dominant signal',
      signalScore: 'National Signal Score',
      updatedNow: 'Live now',
      priorityHigh: 'High priority',
      priorityMedium: 'Medium priority',
      priorityLow: 'Low priority',
      statusCritical: 'Critical',
      statusElevated: 'Elevated',
      statusStable: 'Stable',
      popupReports: 'Mga ulat',
      popupUrgency: 'Avg urgency',
      popupStatus: 'Status',
      anomalyTitle: 'Outbreak Anomaly Engine',
      anomalyHint: 'Kinukumpara ng statistical baselines ang huling 48 oras laban sa nakaraang 14 araw bago gumawa ng AI alerts.',
      anomalyEmpty: 'Walang statistically significant anomaly sa ngayon.',
      confidence: 'Confidence',
      spike: 'Spike',
      zScore: 'Z-score',
      dataSource: 'Data source',
      coverageWindow: 'Coverage window',
      aggregationLevel: 'Aggregation level',
      liveMode: 'Live operational feed',
      syntheticMode: 'Synthetic demo feed',
      syntheticNotice: 'Synthetic sentinel dataset ang ipinapakita para sa demo. Walang totoong pasyente sa datos na ito.',
      emptyFeedNotice: 'Walang live reports na bumalik, kaya nag-load ang Mayari ng synthetic sentinel dataset para sa demo.',
      apiFallbackNotice: 'Hindi maabot ang live public-health API, kaya nag-load ang Mayari ng synthetic sentinel dataset para sa demo.',
      methodologyTitle: 'Methodology and privacy guardrails',
      methodologyBody: 'Aggregated by region at symptom cluster ang signals. Hindi ipinapakita ang patient identifiers, at generated records lang ang demo mode.',
    },
  }[language];

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [topSymptoms, setTopSymptoms] = useState<TopSymptom[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalySignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [dataMode, setDataMode] = useState<'live' | 'synthetic'>('live');
  const [dataNotice, setDataNotice] = useState('');
  const [demoSourceLabel, setDemoSourceLabel] = useState('');

  const loadDashboard = useCallback(async (source: 'initial' | 'refresh' | 'poll' | 'analysis') => {
    try {
      const [nextSummary, nextRegions, nextTrend, nextAlerts, nextSymptoms, nextAnomalies] = await Promise.all([
        getDashboardSummary(),
        getByRegion(),
        getTrend(),
        getActiveAlerts(),
        getTopSymptoms(),
        getAnomalySignals(),
      ]);

      const isEmptyFeed =
        (!nextSummary || nextSummary.total_reports_today === 0)
        && nextRegions.length === 0
        && nextTrend.length === 0
        && nextSymptoms.length === 0;

      startTransition(() => {
        if (isEmptyFeed) {
          const demo = buildPublicHealthDemoDataset();
          setSummary(demo.summary);
          setRegions(demo.regions);
          setTrend(demo.trend);
          setAlerts(demo.alerts);
          setTopSymptoms(demo.topSymptoms);
          setAnomalies(demo.anomalies);
          setDataMode('synthetic');
          setDataNotice(copy.emptyFeedNotice);
          setDemoSourceLabel(demo.sourceLabel);
          setLastUpdatedAt(demo.generatedAt);
        } else {
          setSummary(nextSummary);
          setRegions(nextRegions);
          setTrend(nextTrend);
          setAlerts(nextAlerts);
          setTopSymptoms(nextSymptoms);
          setAnomalies(nextAnomalies);
          setDataMode('live');
          setDataNotice('');
          setDemoSourceLabel('');
          setLastUpdatedAt(new Date());
        }
        setErrorMessage(null);
      });

      if (source === 'refresh') {
        setFeedback({ tone: 'info', message: copy.refreshed });
      }
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(error);
      const demo = buildPublicHealthDemoDataset();
      startTransition(() => {
        setSummary(demo.summary);
        setRegions(demo.regions);
        setTrend(demo.trend);
        setAlerts(demo.alerts);
        setTopSymptoms(demo.topSymptoms);
        setAnomalies(demo.anomalies);
        setDataMode('synthetic');
        setDataNotice(copy.apiFallbackNotice);
        setDemoSourceLabel(demo.sourceLabel);
        setErrorMessage(null);
        setLastUpdatedAt(demo.generatedAt);
      });

      if (source !== 'poll') {
        setFeedback({ tone: 'info', message: `${copy.apiFallbackNotice} (${message})` });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [copy.apiFallbackNotice, copy.emptyFeedNotice, copy.refreshed]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadDashboard('initial');
    }, 0);
    const interval = window.setInterval(() => {
      void loadDashboard('poll');
    }, 60000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  const brief = useMemo(
    () => buildPublicHealthBrief(language, summary, regions, trend, alerts, topSymptoms),
    [alerts, language, regions, summary, topSymptoms, trend],
  );

  const toneClasses = getSignalToneClasses(brief.tone);
  const hotspotCount = brief.hotspots.filter((hotspot) => hotspot.tone !== 'stable').length;

  const handleRefresh = async () => {
    setFeedback(null);
    setIsRefreshing(true);
    await loadDashboard('refresh');
  };

  const handleGenerate = async () => {
    setFeedback(null);
    setIsGenerating(true);

    try {
      const result = await generateIntelligence();
      if (result.anomalies) {
        setAnomalies(result.anomalies);
      }
      await loadDashboard('analysis');
      setFeedback({
        tone: result.alerts_generated > 0 ? 'success' : 'info',
        message: result.alerts_generated > 0 ? result.message || copy.analysisDone : copy.analysisNoAlerts,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(error);
      setFeedback({ tone: 'error', message });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading && !summary) {
    return (
      <main className="min-h-screen bg-slate-50">
        <AppHeader navItems={[...mainNavItems]} showLanguageToggle />
        <div className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 text-slate-600 shadow-sm">
            <RefreshCw className="animate-spin text-teal-600" size={22} />
            <span className="font-semibold">{copy.loading}</span>
          </div>
        </div>
      </main>
    );
  }

  if (!summary && errorMessage) {
    return (
      <main className="min-h-screen bg-slate-50">
        <AppHeader navItems={[...mainNavItems]} showLanguageToggle />
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="rounded-3xl border border-red-200 bg-white p-10 shadow-sm">
            <AlertTriangle className="mx-auto mb-4 text-red-500" size={34} />
            <h1 className="text-2xl font-black text-slate-900">Intelligence feed unavailable</h1>
            <p className="mt-3 text-slate-600">{errorMessage}</p>
            <p className="mt-2 text-sm text-slate-400">{copy.retryHint}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-6 rounded-2xl bg-teal-600 px-5 py-3 font-bold text-white transition-colors hover:bg-teal-700"
            >
              {copy.refresh}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader navItems={[...mainNavItems]} showLanguageToggle />

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-8 md:py-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-amber-500" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-teal-700">
                <Brain size={14} />
                {copy.badge}
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                  {copy.title}
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
                  {copy.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1.5">{copy.liveFeed}</span>
                <span className={`rounded-full px-3 py-1.5 ${toneClasses.badge}`}>
                  {brief.tone === 'critical' ? copy.statusCritical : brief.tone === 'elevated' ? copy.statusElevated : copy.statusStable}
                </span>
                <span className={`rounded-full px-3 py-1.5 ${dataMode === 'synthetic' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {dataMode === 'synthetic' ? copy.syntheticMode : copy.liveMode}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5">
                  {copy.lastUpdated}: {formatLastUpdated(lastUpdatedAt, language)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Activity size={18} className={isGenerating ? 'animate-pulse' : ''} />
                {copy.runAnalysis}
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-700 transition-all hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                {copy.refresh}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{copy.dataSource}</p>
            <p className="mt-2 text-sm font-bold text-slate-800">
              {dataMode === 'synthetic' ? demoSourceLabel || copy.syntheticNotice : 'Live triage sessions and facility workflow signals'}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{copy.coverageWindow}</p>
            <p className="mt-2 text-sm font-bold text-slate-800">Rolling 14 days, 24h hotspot view</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{copy.aggregationLevel}</p>
            <p className="mt-2 text-sm font-bold text-slate-800">Region and symptom cluster</p>
          </div>
        </section>

        {dataNotice ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
            {dataNotice}
          </div>
        ) : null}

        {feedback ? (
          <div className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${feedbackStyles[feedback.tone]}`}>
            {feedback.message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label={copy.signalScore}
            value={brief.signalScore}
            suffix="/100"
            icon={<Brain className={toneClasses.accent} size={28} />}
            iconWrapperClassName={toneClasses.chip}
            cardClassName="rounded-3xl p-6"
            valueClassName="text-4xl"
          />
          <DashboardMetricCard
            label={copy.reports24h}
            value={summary?.total_reports_today ?? 0}
            icon={<Users className="text-blue-600" size={28} />}
            iconWrapperClassName="bg-blue-50"
            cardClassName="rounded-3xl p-6"
            valueClassName="text-4xl"
          />
          <DashboardMetricCard
            label={copy.signalVelocity}
            value={formatVelocity(brief.velocity)}
            icon={<TrendingUp className={brief.velocity >= 0 ? 'text-amber-600' : 'text-emerald-600'} size={28} />}
            iconWrapperClassName={brief.velocity >= 0 ? 'bg-amber-50' : 'bg-emerald-50'}
            cardClassName="rounded-3xl p-6"
            valueClassName="text-4xl"
          />
          <DashboardMetricCard
            label={copy.activeAlerts}
            value={summary?.active_alerts ?? alerts.length}
            icon={<AlertTriangle className="text-red-600" size={28} />}
            iconWrapperClassName="bg-red-50"
            cardClassName="rounded-3xl p-6"
            valueClassName="text-4xl"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.3fr_0.9fr]">
          <section className={`rounded-[2rem] border bg-white p-8 shadow-sm ${toneClasses.border}`}>
            <div className="flex flex-wrap items-center gap-3">
              <div className={`rounded-2xl p-3 ${toneClasses.chip}`}>
                <Shield size={22} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {copy.liveBrief}
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  {brief.hotspots[0]?.region ?? copy.updatedNow}
                </h2>
              </div>
            </div>

            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-700">
              {brief.narrative}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${toneClasses.badge}`}>
                {copy.watchlistLabel}: {brief.hotspots[0]?.signalScore ?? brief.signalScore}
              </span>
              {brief.dominantSymptom ? (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
                  {copy.dominantSignal}: {brief.dominantSymptom.symptom}
                </span>
              ) : null}
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
                Baseline {brief.baselineCount.toFixed(1)} vs latest {brief.latestCount}
              </span>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Activity size={22} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {copy.actionBoard}
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  {hotspotCount > 0 ? `${hotspotCount} live actions` : 'Passive monitoring'}
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {brief.actionPlaybooks.map((action) => {
                const priorityLabel =
                  action.priority === 'high'
                    ? copy.priorityHigh
                    : action.priority === 'medium'
                      ? copy.priorityMedium
                      : copy.priorityLow;

                return (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border p-4 ${getPriorityClasses(action.priority)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold">{action.title}</h3>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        {priorityLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{action.detail}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>

        {summary?.active_alerts || alerts.length ? (
          <section className="rounded-[2rem] border border-orange-200 bg-orange-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-orange-500 p-3 text-white">
                <AlertTriangle size={22} />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-black text-orange-900">{copy.activeAlerts}</h2>
                {alerts.map((alert) => (
                  <p key={alert.id} className="font-medium text-orange-800">
                    {alert.message} ({alert.region})
                  </p>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{copy.anomalyTitle}</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">{copy.anomalyHint}</p>
            </div>
            <Brain className="text-slate-400" size={22} />
          </div>

          {anomalies.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {anomalies.slice(0, 3).map((signal) => {
                const classes = getSignalToneClasses(signal.severity === 'warning' ? 'critical' : signal.severity === 'alert' ? 'elevated' : 'stable');

                return (
                  <motion.article
                    key={`${signal.region}-${signal.symptom_cluster}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-3xl border p-5 ${classes.border}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{signal.region}</p>
                        <h3 className="mt-1 text-xl font-black text-slate-900">{signal.symptom_cluster}</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${classes.badge}`}>
                        {signal.severity}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[9px] font-black uppercase text-slate-400">{copy.spike}</p>
                        <p className={`mt-1 text-lg font-black ${classes.accent}`}>{signal.spike_percentage}%</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[9px] font-black uppercase text-slate-400">{copy.zScore}</p>
                        <p className="mt-1 text-lg font-black text-slate-900">{signal.z_score}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[9px] font-black uppercase text-slate-400">{copy.confidence}</p>
                        <p className="mt-1 text-lg font-black text-slate-900">{Math.round(signal.confidence * 100)}%</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {signal.playbook.slice(0, 2).map((action) => (
                        <p key={action} className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-relaxed text-slate-600">
                          {action}
                        </p>
                      ))}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
              {copy.anomalyEmpty}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{copy.mapTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">{copy.mapHint}</p>
              </div>
              <MapIcon className="text-teal-500" size={22} />
            </div>

            <div className="h-[430px] overflow-hidden rounded-[1.5rem] border border-slate-100">
              <MapContainer
                center={[12.8797, 121.774]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {regions.map((region) => {
                  const avgUrgency = Number(region.avg_urgency || 0);
                  const hotspot = brief.hotspots.find((entry) => entry.region === region.region);
                  const tone = hotspot?.tone ?? (avgUrgency >= 7 ? 'critical' : avgUrgency >= 5 ? 'elevated' : 'stable');
                  const color = tone === 'critical' ? '#dc2626' : tone === 'elevated' ? '#d97706' : '#0d9488';

                  return (
                    <CircleMarker
                      key={region.region}
                      center={getPhilippineRegionCoords(region.region)}
                      radius={Math.max(10, Math.sqrt(region.report_count) * 6)}
                      pathOptions={{
                        color,
                        fillColor: color,
                        fillOpacity: 0.6,
                      }}
                    >
                      <Popup>
                        <div className="space-y-1 p-1">
                          <p className="font-bold">{region.region}</p>
                          <p>{copy.popupReports}: {region.report_count}</p>
                          <p>{copy.popupUrgency}: {avgUrgency.toFixed(1)}</p>
                          <p>{copy.popupStatus}: {tone === 'critical' ? copy.statusCritical : tone === 'elevated' ? copy.statusElevated : copy.statusStable}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{copy.trendTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">Track how report volume changes against the recent baseline.</p>
              </div>
              <TrendingUp className="text-teal-500" size={22} />
            </div>

            <div className="h-[430px]">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 960, height: 430 }}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '18px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0f766e"
                    strokeWidth={4}
                    dot={{ r: 5, fill: '#0f766e', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 8, fill: '#0f766e' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {brief.hotspots.length > 0 ? (
            brief.hotspots.map((hotspot) => {
              const hotspotTone = getSignalToneClasses(hotspot.tone);

              return (
                <motion.article
                  key={hotspot.region}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-[2rem] border bg-white p-6 shadow-sm ${hotspotTone.border}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {copy.watchlistTitle}
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900">{hotspot.region}</h2>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${hotspotTone.badge}`}>
                      {hotspot.tone === 'critical' ? copy.statusCritical : hotspot.tone === 'elevated' ? copy.statusElevated : copy.statusStable}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{copy.watchlistLabel}</p>
                      <p className={`mt-2 text-3xl font-black ${hotspotTone.accent}`}>{hotspot.signalScore}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{copy.tableUrgency}</p>
                      <p className="mt-2 text-3xl font-black text-slate-900">{hotspot.avg_urgency.toFixed(1)}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{hotspot.note}</p>
                </motion.article>
              );
            })
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500 xl:col-span-3">
              {copy.emptyData}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{copy.symptomsTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">Recent symptom clustering across the surveillance feed.</p>
              </div>
              <Activity className="text-blue-500" size={22} />
            </div>

            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 360 }}>
                <BarChart data={topSymptoms} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="symptom"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}
                    width={120}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      borderRadius: '18px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 12, 12, 0]}>
                    {topSymptoms.map((entry, index) => (
                      <Cell
                        key={`${entry.symptom}-${index}`}
                        fill={['#0f766e', '#2563eb', '#d97706', '#db2777'][index % 4]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{copy.tableTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">Rank regions by report density and average urgency.</p>
              </div>
              <MapIcon className="text-teal-500" size={22} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <th className="pb-4">{copy.tableRegion}</th>
                    <th className="pb-4">{copy.tableReports}</th>
                    <th className="pb-4">{copy.tableUrgency}</th>
                    <th className="pb-4">{copy.tableStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {regions.map((region) => {
                    const avgUrgency = Number(region.avg_urgency || 0);
                    const hotspot = brief.hotspots.find((entry) => entry.region === region.region);
                    const tone = hotspot?.tone ?? (avgUrgency >= 7 ? 'critical' : avgUrgency >= 5 ? 'elevated' : 'stable');
                    const rowTone = getSignalToneClasses(tone);

                    return (
                      <tr key={region.region} className="transition-colors hover:bg-slate-50/80">
                        <td className="py-4 font-bold text-slate-900">{region.region}</td>
                        <td className="py-4 font-semibold text-slate-600">{region.report_count}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${tone === 'critical' ? 'bg-red-500' : tone === 'elevated' ? 'bg-amber-500' : 'bg-teal-500'}`}
                                style={{ width: `${Math.min(avgUrgency * 10, 100)}%` }}
                              />
                            </div>
                            <span className="font-semibold text-slate-700">{avgUrgency.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ${rowTone.badge}`}>
                            {tone === 'critical' ? copy.statusCritical : tone === 'elevated' ? copy.statusElevated : copy.statusStable}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Governance</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">{copy.methodologyTitle}</h2>
              <p className="mt-2 max-w-4xl text-sm font-medium leading-relaxed text-slate-600">{copy.methodologyBody}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              {dataMode === 'synthetic' ? copy.syntheticMode : copy.liveMode}
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-2 pb-6 text-sm font-semibold text-slate-400">
          <Clock size={14} />
          {copy.lastUpdated}: {formatLastUpdated(lastUpdatedAt, language)}
        </div>
      </div>
    </main>
  );
}
