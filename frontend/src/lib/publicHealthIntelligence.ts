import type { Language } from '@/contexts/LanguageContext';
import type { Alert, DashboardSummary, RegionStat, TopSymptom, TrendData } from '@/lib/api';

type SignalTone = 'stable' | 'elevated' | 'critical';
type Priority = 'high' | 'medium' | 'low';

export type HotspotSignal = RegionStat & {
  alertSeverity: Alert['severity'] | null;
  signalScore: number;
  tone: SignalTone;
  note: string;
};

export type ActionPlaybook = {
  title: string;
  detail: string;
  priority: Priority;
};

export type PublicHealthBrief = {
  tone: SignalTone;
  signalScore: number;
  velocity: number;
  latestCount: number;
  baselineCount: number;
  narrative: string;
  hotspots: HotspotSignal[];
  actionPlaybooks: ActionPlaybook[];
  dominantSymptom: TopSymptom | null;
};

const severityRank: Record<Alert['severity'], number> = {
  watch: 1,
  alert: 2,
  warning: 3,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const average = (values: number[]) => (values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0);
const toNumber = (value: unknown) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildRegionNote = (language: Language, tone: SignalTone, region: string, avgUrgency: number, dominantSymptom: string | null) => {
  if (language === 'Filipino') {
    if (tone === 'critical') {
      return `${region} is the highest-pressure zone right now at ${avgUrgency}/10${dominantSymptom ? `, led by ${dominantSymptom.toLowerCase()}` : ''}.`;
    }
    if (tone === 'elevated') {
      return `${region} is showing elevated signals at ${avgUrgency}/10${dominantSymptom ? ` with ${dominantSymptom.toLowerCase()} surfacing often` : ''}.`;
    }
    return `${region} remains within normal bounds, but it stays on passive watch.`;
  }

  if (tone === 'critical') {
    return `${region} is the highest-pressure zone right now at ${avgUrgency}/10${dominantSymptom ? `, led by ${dominantSymptom.toLowerCase()}` : ''}.`;
  }
  if (tone === 'elevated') {
    return `${region} is showing elevated signals at ${avgUrgency}/10${dominantSymptom ? ` with ${dominantSymptom.toLowerCase()} surfacing often` : ''}.`;
  }
  return `${region} remains within normal bounds, but it stays on passive watch.`;
};

const buildNarrative = (
  language: Language,
  tone: SignalTone,
  leadRegion: HotspotSignal | null,
  dominantSymptom: TopSymptom | null,
  activeAlerts: number,
  velocity: number,
) => {
  const symptomText = dominantSymptom ? dominantSymptom.symptom.toLowerCase() : language === 'Filipino' ? 'mixed symptoms' : 'mixed symptoms';

  if (language === 'Filipino') {
    if (tone === 'critical' && leadRegion) {
      return `The strongest health signal is centered on ${leadRegion.region}, where report volume, urgency, and alert activity are converging around ${symptomText}. Prioritize field validation and prep nearby facilities for faster triage intake.`;
    }
    if (tone === 'elevated' && leadRegion) {
      return `${leadRegion.region} is starting to accelerate, with ${symptomText} becoming the dominant community signal. Keep facilities aligned, refresh surveillance outreach, and watch the next 24 hours closely.`;
    }
    return `National health signals are stable for now. Keep passive monitoring in place, maintain data quality, and use the command center to spot the next cluster early.`;
  }

  if (tone === 'critical' && leadRegion) {
    return `The strongest health signal is centered on ${leadRegion.region}, where report volume, urgency, and alert activity are converging around ${symptomText}. Prioritize field validation and prep nearby facilities for faster triage intake.`;
  }
  if (tone === 'elevated' && leadRegion) {
    return `${leadRegion.region} is starting to accelerate, with ${symptomText} becoming the dominant community signal. Keep facilities aligned, refresh surveillance outreach, and watch the next 24 hours closely.`;
  }

  return activeAlerts > 0 || velocity > 0
    ? `Signals remain contained, but the system is still catching weak movement in the data. Keep passive monitoring in place and be ready to escalate if symptom clusters intensify.`
    : `National health signals are stable for now. Keep passive monitoring in place, maintain data quality, and use the command center to spot the next cluster early.`;
};

const buildPlaybooks = (
  language: Language,
  tone: SignalTone,
  leadRegion: HotspotSignal | null,
  dominantSymptom: TopSymptom | null,
  velocity: number,
  activeAlerts: number,
): ActionPlaybook[] => {
  const actions: ActionPlaybook[] = [];

  if (leadRegion) {
    actions.push(
      language === 'Filipino'
        ? {
            title: `Escalate ${leadRegion.region} verification`,
            detail: `${leadRegion.report_count} recent reports and an average urgency of ${leadRegion.avg_urgency}/10 make ${leadRegion.region} the top watch zone. Trigger barangay-level validation and alert the nearest facilities.`,
            priority: tone === 'critical' ? 'high' : 'medium',
          }
        : {
            title: `Escalate ${leadRegion.region} verification`,
            detail: `${leadRegion.report_count} recent reports and an average urgency of ${leadRegion.avg_urgency}/10 make ${leadRegion.region} the top watch zone. Trigger barangay-level validation and alert the nearest facilities.`,
            priority: tone === 'critical' ? 'high' : 'medium',
          },
    );
  }

  if (dominantSymptom) {
    actions.push(
      language === 'Filipino'
        ? {
            title: `Pre-position response kits for ${dominantSymptom.symptom}`,
            detail: `${dominantSymptom.count} recent reports are clustering around ${dominantSymptom.symptom.toLowerCase()}. Stage the matching consumables, scripts, and patient education before queues rise.`,
            priority: tone === 'stable' ? 'low' : 'medium',
          }
        : {
            title: `Pre-position response kits for ${dominantSymptom.symptom}`,
            detail: `${dominantSymptom.count} recent reports are clustering around ${dominantSymptom.symptom.toLowerCase()}. Stage the matching consumables, scripts, and patient education before queues rise.`,
            priority: tone === 'stable' ? 'low' : 'medium',
          },
    );
  }

  if (velocity >= 20 || activeAlerts > 0) {
    actions.push(
      language === 'Filipino'
        ? {
            title: 'Auto-draft a community advisory',
            detail: `The system is seeing ${velocity >= 20 ? 'surging report velocity' : 'active alert activity'}. Prepare a barangay-ready advisory so local teams can publish quickly if the signal strengthens.`,
            priority: velocity >= 35 || activeAlerts > 1 ? 'high' : 'medium',
          }
        : {
            title: 'Auto-draft a community advisory',
            detail: `The system is seeing ${velocity >= 20 ? 'surging report velocity' : 'active alert activity'}. Prepare a barangay-ready advisory so local teams can publish quickly if the signal strengthens.`,
            priority: velocity >= 35 || activeAlerts > 1 ? 'high' : 'medium',
          },
    );
  } else {
    actions.push(
      language === 'Filipino'
        ? {
            title: 'Keep passive surveillance live',
            detail: 'No hard escalation is needed right now. Continue hourly refresh, protect data quality, and keep the alert pipeline ready for the next anomaly.',
            priority: 'low',
          }
        : {
            title: 'Keep passive surveillance live',
            detail: 'No hard escalation is needed right now. Continue hourly refresh, protect data quality, and keep the alert pipeline ready for the next anomaly.',
            priority: 'low',
          },
    );
  }

  return actions.slice(0, 3);
};

export const buildPublicHealthBrief = (
  language: Language,
  summary: DashboardSummary | null,
  regions: RegionStat[],
  trend: TrendData[],
  alerts: Alert[],
  topSymptoms: TopSymptom[],
): PublicHealthBrief => {
  const activeAlerts = summary?.active_alerts ?? alerts.length;
  const dominantSymptom = topSymptoms[0] ?? null;
  const alertMap = new Map<string, Alert['severity']>();

  alerts.forEach((alert) => {
    const current = alertMap.get(alert.region);
    if (!current || severityRank[alert.severity] > severityRank[current]) {
      alertMap.set(alert.region, alert.severity);
    }
  });

  const hotspots = [...regions]
    .map((region) => {
      const avgUrgency = toNumber(region.avg_urgency);
      const alertSeverity = alertMap.get(region.region) ?? null;
      const alertBoost = alertSeverity === 'warning' ? 20 : alertSeverity === 'alert' ? 12 : alertSeverity === 'watch' ? 6 : 0;
      const signalScore = clamp(Math.round(region.report_count * 4 + avgUrgency * 6 + alertBoost), 0, 100);
      const tone: SignalTone =
        alertSeverity === 'warning' || avgUrgency >= 7.5 || signalScore >= 75
          ? 'critical'
          : alertSeverity !== null || avgUrgency >= 5 || signalScore >= 45
            ? 'elevated'
            : 'stable';

      return {
        ...region,
        avg_urgency: avgUrgency,
        alertSeverity,
        signalScore,
        tone,
        note: buildRegionNote(language, tone, region.region, avgUrgency, dominantSymptom?.symptom ?? null),
      };
    })
    .sort((left, right) => right.signalScore - left.signalScore)
    .slice(0, 3);

  const latestCount = toNumber(trend.at(-1)?.count ?? summary?.total_reports_today ?? 0);
  const baselineSeries = trend.length > 3 ? trend.slice(-4, -1) : trend.slice(0, -1);
  const baselineCount = Number(average(baselineSeries.map((entry) => toNumber(entry.count))).toFixed(1));
  const velocity = Number(
    (baselineCount === 0
      ? latestCount > 0
        ? 100
        : 0
      : ((latestCount - baselineCount) / baselineCount) * 100
    ).toFixed(1),
  );

  const avgUrgency = toNumber(summary?.avg_urgency_score);
  const leadRegion = hotspots[0] ?? null;
  const signalScore = clamp(
    Math.round((leadRegion?.signalScore ?? avgUrgency * 8) * 0.55 + avgUrgency * 4 + Math.min(activeAlerts * 9, 24) + Math.min(Math.abs(velocity), 18)),
    0,
    100,
  );

  const tone: SignalTone =
    activeAlerts > 1 || signalScore >= 75 || leadRegion?.tone === 'critical'
      ? 'critical'
      : activeAlerts > 0 || velocity >= 20 || signalScore >= 45 || leadRegion?.tone === 'elevated'
        ? 'elevated'
        : 'stable';

  return {
    tone,
    signalScore,
    velocity,
    latestCount,
    baselineCount,
    narrative: buildNarrative(language, tone, leadRegion, dominantSymptom, activeAlerts, velocity),
    hotspots,
    actionPlaybooks: buildPlaybooks(language, tone, leadRegion, dominantSymptom, velocity, activeAlerts),
    dominantSymptom,
  };
};

export const getSignalToneClasses = (tone: SignalTone) => {
  if (tone === 'critical') {
    return {
      badge: 'bg-red-100 text-red-700',
      border: 'border-red-200',
      accent: 'text-red-600',
      chip: 'bg-red-50 text-red-700',
    };
  }
  if (tone === 'elevated') {
    return {
      badge: 'bg-amber-100 text-amber-700',
      border: 'border-amber-200',
      accent: 'text-amber-600',
      chip: 'bg-amber-50 text-amber-700',
    };
  }
  return {
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200',
    accent: 'text-emerald-600',
    chip: 'bg-emerald-50 text-emerald-700',
  };
};

export const getPriorityClasses = (priority: Priority) => {
  if (priority === 'high') {
    return 'border-red-200 bg-red-50 text-red-700';
  }
  if (priority === 'medium') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  return 'border-slate-200 bg-slate-50 text-slate-600';
};

export const getPhilippineRegionCoords = (region: string): [number, number] => {
  const regions: Record<string, [number, number]> = {
    'Metro Manila': [14.5995, 120.9842],
    'Ilocos Region': [17.5705, 120.3871],
    'Cagayan Valley': [17.6132, 121.7271],
    'Central Luzon': [15.4828, 120.712],
    CALABARZON: [14.1008, 121.0794],
    MIMAROPA: [12.9996, 121.0188],
    'Bicol Region': [13.4115, 123.3345],
    'Western Visayas': [10.7202, 122.5621],
    'Central Visayas': [10.3157, 123.8854],
    'Eastern Visayas': [11.2444, 125.0033],
    'Zamboanga Peninsula': [7.843, 123.1946],
    'Northern Mindanao': [8.4542, 124.6319],
    'Davao Region': [7.1907, 125.4553],
    SOCCSKSARGEN: [6.5235, 124.8426],
    Caraga: [9.0478, 125.8093],
    BARMM: [7.2096, 124.2417],
    'Cordillera Administrative Region': [17.4124, 120.9184],
  };

  return regions[region] || [12.8797, 121.774];
};
