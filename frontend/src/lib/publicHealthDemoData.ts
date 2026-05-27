import type { Alert, AnomalySignal, DashboardSummary, RegionStat, TopSymptom, TrendData } from '@/lib/api';

export type PublicHealthDemoDataset = {
  generatedAt: Date;
  scenarioName: string;
  sourceLabel: string;
  summary: DashboardSummary;
  regions: RegionStat[];
  trend: TrendData[];
  alerts: Alert[];
  topSymptoms: TopSymptom[];
  anomalies: AnomalySignal[];
};

const seededRandom = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const formatDay = (date: Date) =>
  new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(date);

const roundUrgency = (value: number) => Number(Math.max(2.4, Math.min(8.9, value)).toFixed(1));

export const buildPublicHealthDemoDataset = (now = new Date()): PublicHealthDemoDataset => {
  const seed = Number(
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`,
  );
  const random = seededRandom(seed);
  const jitter = (spread: number) => Math.round((random() - 0.5) * spread);

  const generatedAt = new Date(now);
  const regions: RegionStat[] = [
    { region: 'Metro Manila', report_count: 48 + jitter(8), avg_urgency: roundUrgency(6.8 + random() * 0.6) },
    { region: 'CALABARZON', report_count: 42 + jitter(8), avg_urgency: roundUrgency(7.4 + random() * 0.5) },
    { region: 'Central Luzon', report_count: 31 + jitter(7), avg_urgency: roundUrgency(6.2 + random() * 0.8) },
    { region: 'Western Visayas', report_count: 27 + jitter(6), avg_urgency: roundUrgency(6.9 + random() * 0.5) },
    { region: 'Central Visayas', report_count: 22 + jitter(5), avg_urgency: roundUrgency(5.6 + random() * 0.5) },
    { region: 'Eastern Visayas', report_count: 18 + jitter(5), avg_urgency: roundUrgency(5.9 + random() * 0.7) },
    { region: 'Bicol Region', report_count: 15 + jitter(4), avg_urgency: roundUrgency(5.2 + random() * 0.6) },
    { region: 'Northern Mindanao', report_count: 14 + jitter(4), avg_urgency: roundUrgency(4.8 + random() * 0.6) },
    { region: 'Davao Region', report_count: 12 + jitter(4), avg_urgency: roundUrgency(4.7 + random() * 0.5) },
    { region: 'Ilocos Region', report_count: 11 + jitter(3), avg_urgency: roundUrgency(4.3 + random() * 0.5) },
  ].map((region) => ({
    ...region,
    report_count: Math.max(6, region.report_count),
  }));

  const totalReports = regions.reduce((sum, region) => sum + region.report_count, 0);
  const weightedUrgency = regions.reduce((sum, region) => sum + region.avg_urgency * region.report_count, 0) / totalReports;

  const trend: TrendData[] = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(generatedAt);
    date.setDate(date.getDate() - (13 - index));
    const wave = Math.sin(index / 2.1) * 8;
    const acceleration = index > 9 ? (index - 9) * 9 : index > 6 ? (index - 6) * 3 : 0;
    return {
      date: formatDay(date),
      count: Math.max(42, Math.round(78 + wave + acceleration + jitter(12))),
    };
  });

  const topSymptoms: TopSymptom[] = [
    { symptom: 'Fever', count: 76 + jitter(8) },
    { symptom: 'Cough', count: 61 + jitter(8) },
    { symptom: 'Body aches', count: 45 + jitter(6) },
    { symptom: 'Headache', count: 39 + jitter(5) },
    { symptom: 'Rash', count: 28 + jitter(4) },
    { symptom: 'Diarrhea', count: 23 + jitter(4) },
  ].map((symptom) => ({ ...symptom, count: Math.max(10, symptom.count) }));

  const alerts: Alert[] = [
    {
      id: 'SYN-CALABARZON-DENGUE',
      symptom_cluster: 'Fever with rash and body aches',
      region: 'CALABARZON',
      spike_percentage: 64,
      severity: 'warning',
      message: 'Dengue-like symptom cluster is above the synthetic 14-day baseline in CALABARZON.',
      created_at: generatedAt.toISOString(),
    },
    {
      id: 'SYN-NCR-ILI',
      symptom_cluster: 'Cough, fever, sore throat',
      region: 'Metro Manila',
      spike_percentage: 43,
      severity: 'alert',
      message: 'Influenza-like illness signals are rising across high-density Metro Manila catchments.',
      created_at: generatedAt.toISOString(),
    },
    {
      id: 'SYN-WV-FEVER',
      symptom_cluster: 'Fever and headache',
      region: 'Western Visayas',
      spike_percentage: 36,
      severity: 'watch',
      message: 'Sustained fever reports warrant barangay-level validation in Western Visayas.',
      created_at: generatedAt.toISOString(),
    },
  ];

  const anomalies: AnomalySignal[] = [
    {
      region: 'CALABARZON',
      symptom_cluster: 'Fever + rash + body aches',
      recent_count: 31,
      baseline_count: 14,
      expected_count: 15,
      spike_percentage: 64,
      z_score: 3.1,
      avg_urgency: 7.8,
      severity: 'warning',
      confidence: 0.87,
      playbook: [
        'Validate dengue-like symptoms with RHU and barangay health worker reports.',
        'Pre-position rapid test referral scripts and hydration guidance for facilities.',
        'Trigger mosquito-breeding-site advisory for affected municipalities.',
      ],
    },
    {
      region: 'Metro Manila',
      symptom_cluster: 'Cough + fever + sore throat',
      recent_count: 44,
      baseline_count: 25,
      expected_count: 27,
      spike_percentage: 43,
      z_score: 2.4,
      avg_urgency: 6.9,
      severity: 'alert',
      confidence: 0.79,
      playbook: [
        'Notify outpatient clinics to separate respiratory symptom queues.',
        'Refresh masking and ventilation advisory language for public counters.',
        'Monitor pediatric and senior reports for escalation.',
      ],
    },
    {
      region: 'Eastern Visayas',
      symptom_cluster: 'Diarrhea + vomiting + abdominal pain',
      recent_count: 17,
      baseline_count: 10,
      expected_count: 11,
      spike_percentage: 32,
      z_score: 1.9,
      avg_urgency: 5.8,
      severity: 'watch',
      confidence: 0.72,
      playbook: [
        'Check for water interruption or food-safety reports in affected barangays.',
        'Prepare oral rehydration counseling and referral triggers.',
        'Track household clustering for the next 48 hours.',
      ],
    },
  ];

  return {
    generatedAt,
    scenarioName: 'Synthetic sentinel surveillance scenario',
    sourceLabel: 'Generated demo data. No real patients are represented.',
    summary: {
      total_reports_today: totalReports,
      avg_urgency_score: Number(weightedUrgency.toFixed(1)),
      most_affected_region: 'CALABARZON',
      active_alerts: alerts.length,
    },
    regions,
    trend,
    alerts,
    topSymptoms,
    anomalies,
  };
};
