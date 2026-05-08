import type { ParsedExport } from '../types';

export interface TimeBucket {
  key: string; // e.g. "2024-03"
  count: number;
}

export interface Counter {
  label: string;
  value: number;
}

export interface InsightFinding {
  title: string;
  evidence: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  area: 'network' | 'content' | 'career' | 'messaging' | 'ads' | 'security' | 'overview';
}

export interface DerivedInsights {
  overview: {
    totalConnections: number;
    totalInvitations: number;
    totalShares: number;
    totalReactions: number;
    totalComments: number;
    totalMessages: number;
    totalSearches: number;
    totalJobApps: number;
    totalLearningItems: number;
    totalAdClicks: number;
    accountAgeYears?: number;
    activeYears: number;
    headline?: string;
    industry?: string;
    location?: string;
    name?: string;
  };
  network: {
    connectionsByMonth: TimeBucket[];
    topCompanies: Counter[];
    topPositions: Counter[];
    invitationDirection: { incoming: number; outgoing: number };
    invitationsByMonth: TimeBucket[];
    companyFollows: number;
    memberFollows: number;
    importedContacts: number;
  };
  content: {
    sharesByMonth: TimeBucket[];
    reactionsByMonth: TimeBucket[];
    commentsByMonth: TimeBucket[];
    reactionTypes: Counter[];
    topHashtags: Counter[];
    topSharedDomains: Counter[];
    weekdayActivity: { weekday: string; count: number }[];
    hourActivity: { hour: number; count: number }[];
    engagementStyle: 'creator-heavy' | 'commenter-heavy' | 'consumer-heavy' | 'balanced' | 'low-activity';
  };
  career: {
    jobAppsByMonth: TimeBucket[];
    topAppliedCompanies: Counter[];
    topAppliedTitles: Counter[];
    topSearchTerms: Counter[];
    searchesByMonth: TimeBucket[];
    skills: string[];
    positions: { title?: string; company?: string; from?: string; to?: string; durationMonths?: number }[];
    averageTenureMonths?: number;
  };
  messaging: {
    messagesByMonth: TimeBucket[];
    topConversations: Counter[];
    inbound: number;
    outbound: number;
    uniqueConversations: number;
    longestSilenceDays?: number;
    medianContentLength?: number;
  };
  ads: {
    adClicks: number;
    lanAdsEngagement: number;
    topInferenceCategories: Counter[];
    topAdTargeting: Counter[];
  };
  security: {
    accountAgeYears?: number;
    loginsCount: number;
    challengesCount: number;
    uniqueLoginCountries: number;
    distinctUserAgents: number;
  };
  scores: {
    networkGrowth: {
      last12Months: number;
      previous12Months: number;
      growthRatePct?: number;
      trend: 'up' | 'down' | 'flat' | 'unknown';
    };
    networkConcentration: {
      topCompanyShare: number; // 0-100
      top5CompanyShare: number; // 0-100
      hhi: number; // 0-10000
      verdict: 'concentrated' | 'balanced' | 'diverse';
    };
    contentConsistency: {
      activeSpanMonths: number;
      postingMonths: number;
      score: number; // 0-100
      verdict: 'sporadic' | 'occasional' | 'steady' | 'consistent';
    };
    jobSearchFunnel: {
      searches: number;
      saved: number;
      applications: number;
      searchToApplyRatio?: number;
    };
    applicationIntensity: {
      peakMonth?: string;
      peakCount: number;
      activeMonths: number;
      appsPerActiveMonth: number;
      verdict: 'idle' | 'light' | 'steady' | 'aggressive';
    };
    privacySecurity: {
      score: number; // 0-100
      verdict: 'low' | 'medium' | 'high';
      signals: string[];
    };
    exportCoverage: {
      detected: number;
      total: number;
      pct: number; // 0-100
      missingHighValue: string[];
    };
  };
  findings: InsightFinding[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatYearMonth = (d?: Date) => (d ? `${d.getFullYear()}-${MONTHS[d.getMonth()]}` : undefined);
const sortYearMonth = (key: string) => {
  const [year, month] = key.split('-');
  return Number(year) * 12 + MONTHS.indexOf(month);
};

function bucketByMonth(dates: (Date | undefined)[]): TimeBucket[] {
  const map = new Map<string, number>();
  for (const d of dates) {
    const k = formatYearMonth(d);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => sortYearMonth(a) - sortYearMonth(b))
    .map(([key, count]) => ({ key, count }));
}

function topCounter(values: (string | undefined | null)[], n = 10): Counter[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    const s = (v ?? '').trim();
    if (!s) continue;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, value]) => ({ label, value }));
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function bucketByWeekday(dates: (Date | undefined)[]) {
  const counts = new Array(7).fill(0);
  for (const d of dates) if (d) counts[d.getDay()]++;
  return WEEKDAYS.map((weekday, i) => ({ weekday, count: counts[i] }));
}

function bucketByHour(dates: (Date | undefined)[]) {
  const counts = new Array(24).fill(0);
  for (const d of dates) if (d) counts[d.getHours()]++;
  return counts.map((count, hour) => ({ hour, count }));
}

function median(nums: number[]): number | undefined {
  if (!nums.length) return undefined;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function clamp(n: number, min: number, max: number): number { return Math.max(min, Math.min(max, n)); }

function sumLastNMonths(buckets: TimeBucket[], n: number): number {
  return buckets.slice(-n).reduce((acc, b) => acc + b.count, 0);
}

function sumPriorNMonths(buckets: TimeBucket[], skip: number, n: number): number {
  const end = buckets.length - skip;
  return buckets.slice(Math.max(0, end - n), Math.max(0, end)).reduce((acc, b) => acc + b.count, 0);
}

function extractHashtags(text: string | undefined): string[] {
  if (!text) return [];
  const m = text.match(/#[\p{L}\p{N}_]+/gu);
  return (m ?? []).map((s) => s.toLowerCase());
}

function domainOf(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

export function deriveInsights(d: ParsedExport): DerivedInsights {
  const findings: InsightFinding[] = [];

  // Overview
  const reg = d.registration?.registeredAt;
  const accountAgeYears = reg ? (Date.now() - reg.getTime()) / (365.25 * 24 * 3600 * 1000) : undefined;

  const allDates = [
    ...d.connections.map((c) => c.connectedOn),
    ...d.invitations.map((i) => i.sentAt),
    ...d.shares.map((s) => s.date),
    ...d.reactions.map((r) => r.date),
    ...d.comments.map((c) => c.date),
    ...d.messages.map((m) => m.date),
    ...d.searchQueries.map((s) => s.time),
  ].filter((x): x is Date => !!x);
  const minDate = allDates.length ? new Date(Math.min(...allDates.map((x) => x.getTime()))) : undefined;
  const maxDate = allDates.length ? new Date(Math.max(...allDates.map((x) => x.getTime()))) : undefined;
  const activeYears = (minDate && maxDate) ? Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / (365.25 * 24 * 3600 * 1000))) : 0;

  // Network
  const connectionsByMonth = bucketByMonth(d.connections.map((c) => c.connectedOn));
  const topCompanies = topCounter(d.connections.map((c) => c.company));
  const topPositions = topCounter(d.connections.map((c) => c.position));
  const invitationDirection = d.invitations.reduce(
    (acc, i) => {
      const dir = (i.direction || '').toUpperCase();
      if (dir.includes('OUT')) acc.outgoing++;
      else acc.incoming++;
      return acc;
    },
    { incoming: 0, outgoing: 0 },
  );
  const invitationsByMonth = bucketByMonth(d.invitations.map((i) => i.sentAt));

  // Content
  const sharesByMonth = bucketByMonth(d.shares.map((s) => s.date));
  const reactionsByMonth = bucketByMonth(d.reactions.map((r) => r.date));
  const commentsByMonth = bucketByMonth(d.comments.map((c) => c.date));
  const reactionTypes = topCounter(d.reactions.map((r) => r.type));
  const hashtagsFromShares = d.shares.flatMap((s) => extractHashtags(s.commentary));
  const hashtagsFollowed = d.hashtagFollows.map((s) => s.toLowerCase());
  const topHashtags = topCounter([...hashtagsFromShares, ...hashtagsFollowed]);
  const topSharedDomains = topCounter([
    ...d.shares.map((s) => domainOf(s.sharedUrl)),
    ...d.savedItems.map((s) => domainOf(s.savedItem)),
  ]);
  const contentDates = [
    ...d.shares.map((s) => s.date),
    ...d.reactions.map((r) => r.date),
    ...d.comments.map((c) => c.date),
  ];
  const weekdayActivity = bucketByWeekday(contentDates);
  const hourActivity = bucketByHour(contentDates);
  let engagementStyle: DerivedInsights['content']['engagementStyle'] = 'low-activity';
  const totalEng = d.shares.length + d.reactions.length + d.comments.length;
  if (totalEng > 0) {
    const sharePct = d.shares.length / totalEng;
    const commentPct = d.comments.length / totalEng;
    const reactionPct = d.reactions.length / totalEng;
    if (totalEng < 25) engagementStyle = 'low-activity';
    else if (sharePct > 0.2) engagementStyle = 'creator-heavy';
    else if (commentPct > 0.2) engagementStyle = 'commenter-heavy';
    else if (reactionPct > 0.7) engagementStyle = 'consumer-heavy';
    else engagementStyle = 'balanced';
  }

  // Career
  const jobAppsByMonth = bucketByMonth(d.jobApplications.map((j) => j.applicationDate));
  const topAppliedCompanies = topCounter(d.jobApplications.map((j) => j.companyName));
  const topAppliedTitles = topCounter(d.jobApplications.map((j) => j.jobTitle));
  const topSearchTerms = topCounter(d.searchQueries.map((s) => s.query.toLowerCase()), 15);
  const searchesByMonth = bucketByMonth(d.searchQueries.map((s) => s.time));
  const skills = d.skills.map((s) => s.name);
  const positions = d.positions.map((p) => {
    const months = (p.startedOn && p.finishedOn)
      ? (p.finishedOn.getFullYear() - p.startedOn.getFullYear()) * 12 + (p.finishedOn.getMonth() - p.startedOn.getMonth())
      : (p.startedOn ? Math.round((Date.now() - p.startedOn.getTime()) / (30.44 * 24 * 3600 * 1000)) : undefined);
    return {
      title: p.title,
      company: p.companyName,
      from: formatYearMonth(p.startedOn),
      to: formatYearMonth(p.finishedOn) ?? 'present',
      durationMonths: months,
    };
  });
  const tenureMonths = positions.map((p) => p.durationMonths).filter((x): x is number => typeof x === 'number');
  const averageTenureMonths = tenureMonths.length
    ? Math.round(tenureMonths.reduce((a, b) => a + b, 0) / tenureMonths.length)
    : undefined;

  // Messaging
  const messagesByMonth = bucketByMonth(d.messages.map((m) => m.date));
  const topConversations = topCounter(d.messages.map((m) => m.conversationTitle), 10);
  const me = d.profile ? `${d.profile.firstName ?? ''} ${d.profile.lastName ?? ''}`.trim() : '';
  const inbound = d.messages.filter((m) => me && m.from && m.from.trim() && m.from.trim() !== me).length;
  const outbound = me ? d.messages.filter((m) => m.from?.trim() === me).length : 0;
  const conversationIds = new Set(d.messages.map((m) => m.conversationId).filter(Boolean));
  const messageDates = d.messages.map((m) => m.date).filter((x): x is Date => !!x).sort((a, b) => a.getTime() - b.getTime());
  let longestSilenceDays: number | undefined;
  for (let i = 1; i < messageDates.length; i++) {
    const gap = (messageDates[i].getTime() - messageDates[i - 1].getTime()) / (24 * 3600 * 1000);
    if (longestSilenceDays === undefined || gap > longestSilenceDays) longestSilenceDays = gap;
  }
  const medianContentLength = median(d.messages.map((m) => m.contentLength ?? 0));

  // Ads
  const inferenceCounts = topCounter(d.inferences.map((i) => i.category), 12);
  const adTargetingCounts = topCounter(d.adTargeting.map((i) => i.category), 12);

  // Security
  const uniqueLoginCountries = new Set(d.logins.map((l) => l.userAgent && l.ipAddress ? l.ipAddress.split('.').slice(0, 2).join('.') : undefined).filter(Boolean)).size;
  const distinctUserAgents = new Set(d.logins.map((l) => l.userAgent).filter(Boolean)).size;

  // Findings
  if (d.connections.length > 500) {
    findings.push({
      area: 'network',
      title: 'Established professional network',
      evidence: `${d.connections.length.toLocaleString()} connections accumulated; recent additions are visible in the network growth chart.`,
      recommendation: 'Identify the most relevant 50–100 connections for your current goals and re-engage with a tailored update or coffee chat.',
      priority: 'high',
    });
  }
  if (topCompanies[0] && topCompanies[0].value > Math.max(20, d.connections.length * 0.1)) {
    findings.push({
      area: 'network',
      title: `Network concentrated in ${topCompanies[0].label}`,
      evidence: `${topCompanies[0].value} of your connections list ${topCompanies[0].label} as their company.`,
      recommendation: 'Diversify your network by intentionally connecting with people in adjacent industries or target companies.',
      priority: 'medium',
    });
  }
  if (engagementStyle === 'consumer-heavy') {
    findings.push({
      area: 'content',
      title: 'High consumption, low creation',
      evidence: `${d.reactions.length.toLocaleString()} reactions vs only ${d.shares.length} shares and ${d.comments.length} comments.`,
      recommendation: 'Convert one weekly reaction into a comment or short post to build visibility around your interests.',
      priority: 'medium',
    });
  }
  if (engagementStyle === 'low-activity' && d.connections.length > 200) {
    findings.push({
      area: 'content',
      title: 'Underutilized professional reach',
      evidence: `Large network (${d.connections.length}) but limited engagement activity.`,
      recommendation: 'Even one post per month on your specialty can compound visibility quickly with this audience size.',
      priority: 'high',
    });
  }
  if (d.searchQueries.length > 1000 && d.jobApplications.length < 10) {
    findings.push({
      area: 'career',
      title: 'High research, low application volume',
      evidence: `${d.searchQueries.length.toLocaleString()} search queries vs ${d.jobApplications.length} applications.`,
      recommendation: 'Set a weekly application target. Convert top recurring searches into a saved alerts + apply ritual.',
      priority: 'high',
    });
  }
  if (topAppliedCompanies[0]) {
    findings.push({
      area: 'career',
      title: `Top target company: ${topAppliedCompanies[0].label}`,
      evidence: `${topAppliedCompanies[0].value} applications submitted.`,
      recommendation: 'Build a referral path: identify connections at this company and request a warm intro before reapplying.',
      priority: 'medium',
    });
  }
  if (topAppliedTitles.length > 0 && topAppliedTitles.length < 4 && d.jobApplications.length > 20) {
    findings.push({
      area: 'career',
      title: 'Focused job-title targeting',
      evidence: `Applications cluster around ${topAppliedTitles.slice(0, 3).map((t) => t.label).join(', ')}.`,
      recommendation: 'Lean into this focus in your headline, summary, and post topics to reinforce signal to recruiters.',
      priority: 'medium',
    });
  }
  if (d.messages.length > 500) {
    findings.push({
      area: 'messaging',
      title: 'Active messaging history',
      evidence: `${d.messages.length.toLocaleString()} message records across ${conversationIds.size} conversations.`,
      recommendation: 'Re-engage the top 5 dormant high-volume contacts with a low-pressure check-in.',
      priority: 'medium',
    });
  }
  if (d.adClicks > 1000) {
    findings.push({
      area: 'ads',
      title: 'High ad interaction footprint',
      evidence: `${d.adClicks.toLocaleString()} ad clicks recorded.`,
      recommendation: 'Review LinkedIn ad and inferred-interest settings to align how the platform represents you.',
      priority: 'low',
    });
  }
  if ((d.securityChallenges?.length ?? 0) > 5) {
    findings.push({
      area: 'security',
      title: 'Repeated security challenges',
      evidence: `${d.securityChallenges.length} security challenge events.`,
      recommendation: 'Confirm 2FA is enabled and review recent active sessions and trusted devices.',
      priority: 'medium',
    });
  }
  if (accountAgeYears && accountAgeYears > 5 && d.shares.length === 0) {
    findings.push({
      area: 'overview',
      title: 'Long tenure but no posts',
      evidence: `Account is ~${Math.round(accountAgeYears)} years old with zero share history.`,
      recommendation: 'A single thoughtful post on what you’re working on can outperform years of passive presence.',
      priority: 'medium',
    });
  }

  // -------------------- Scores --------------------

  // Network growth rate (last 12 vs previous 12)
  const last12 = sumLastNMonths(connectionsByMonth, 12);
  const prev12 = sumPriorNMonths(connectionsByMonth, 12, 12);
  const growthRatePct = prev12 > 0 ? ((last12 - prev12) / prev12) * 100 : undefined;
  const growthTrend: 'up' | 'down' | 'flat' | 'unknown' =
    growthRatePct == null ? 'unknown'
      : growthRatePct > 10 ? 'up'
        : growthRatePct < -10 ? 'down'
          : 'flat';

  // Network concentration (HHI + top-N share, computed across full distribution)
  const companyCounts = new Map<string, number>();
  for (const c of d.connections) {
    const key = (c.company ?? '').trim();
    if (!key) continue;
    companyCounts.set(key, (companyCounts.get(key) ?? 0) + 1);
  }
  const totalCompanyKnown = Array.from(companyCounts.values()).reduce((a, b) => a + b, 0);
  const sortedCompanyShares = Array.from(companyCounts.values()).sort((a, b) => b - a);
  const topCompanyShare = totalCompanyKnown > 0 ? (sortedCompanyShares[0] / totalCompanyKnown) * 100 : 0;
  const top5CompanyShare = totalCompanyKnown > 0
    ? (sortedCompanyShares.slice(0, 5).reduce((a, b) => a + b, 0) / totalCompanyKnown) * 100
    : 0;
  const hhi = totalCompanyKnown > 0
    ? sortedCompanyShares.reduce((acc, v) => acc + Math.pow((v / totalCompanyKnown) * 100, 2), 0)
    : 0;
  const concentrationVerdict: 'concentrated' | 'balanced' | 'diverse' =
    hhi > 1500 ? 'concentrated' : hhi > 500 ? 'balanced' : 'diverse';

  // Content consistency: % of months with any content activity over the active span
  const contentMonthsSet = new Set<string>();
  for (const dt of contentDates) {
    const k = formatYearMonth(dt);
    if (k) contentMonthsSet.add(k);
  }
  const postingMonths = contentMonthsSet.size;
  let activeSpanMonths = 0;
  if (minDate && maxDate) {
    activeSpanMonths = Math.max(
      1,
      (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth()) + 1,
    );
  }
  const consistencyScore = activeSpanMonths > 0 ? Math.round((postingMonths / activeSpanMonths) * 100) : 0;
  const consistencyVerdict: 'sporadic' | 'occasional' | 'steady' | 'consistent' =
    consistencyScore >= 75 ? 'consistent'
      : consistencyScore >= 40 ? 'steady'
        : consistencyScore >= 15 ? 'occasional'
          : 'sporadic';

  // Job search funnel
  const searchesCount = d.searchQueries.length;
  const savedCount = d.savedJobs.length;
  const applicationsCount = d.jobApplications.length;
  const searchToApplyRatio = searchesCount > 0 ? applicationsCount / searchesCount : undefined;

  // Application intensity
  const peakAppBucket = jobAppsByMonth.reduce<TimeBucket | undefined>(
    (best, b) => (best == null || b.count > best.count ? b : best),
    undefined,
  );
  const appActiveMonths = jobAppsByMonth.filter((b) => b.count > 0).length;
  const appsPerActiveMonth = appActiveMonths > 0
    ? Math.round((applicationsCount / appActiveMonths) * 10) / 10
    : 0;
  const appVerdict: 'idle' | 'light' | 'steady' | 'aggressive' =
    appsPerActiveMonth === 0 ? 'idle'
      : appsPerActiveMonth < 3 ? 'light'
        : appsPerActiveMonth < 10 ? 'steady'
          : 'aggressive';

  // Privacy / security score
  const privacySignals: string[] = [];
  let privacyScore = 100;
  if (d.securityChallenges.length > 5) {
    const penalty = Math.min(25, (d.securityChallenges.length - 5) * 2);
    privacyScore -= penalty;
    privacySignals.push(`${d.securityChallenges.length} security challenges recorded`);
  }
  if (d.adClicks > 1000) {
    const penalty = Math.min(25, Math.floor(d.adClicks / 100));
    privacyScore -= penalty;
    privacySignals.push(`${d.adClicks.toLocaleString()} ad clicks recorded`);
  }
  if (d.inferences.length > 50) {
    privacyScore -= Math.min(20, Math.floor((d.inferences.length - 50) / 5));
    privacySignals.push(`${d.inferences.length} ad-targeting inferences known`);
  }
  if (uniqueLoginCountries > 5) {
    privacyScore -= 5;
    privacySignals.push(`${uniqueLoginCountries} distinct login regions`);
  }
  if (distinctUserAgents > 10) {
    privacyScore -= 5;
    privacySignals.push(`${distinctUserAgents} distinct devices/browsers`);
  }
  privacyScore = clamp(Math.round(privacyScore), 0, 100);
  const privacyVerdict: 'low' | 'medium' | 'high' =
    privacyScore >= 70 ? 'high' : privacyScore >= 40 ? 'medium' : 'low';

  // Export coverage
  const detectedCount = d.detectedFiles.length;
  const totalKnown = detectedCount + d.missingFiles.length;
  const coveragePct = totalKnown > 0 ? Math.round((detectedCount / totalKnown) * 100) : 0;
  const HIGH_VALUE = ['Profile.csv', 'Connections.csv', 'Reactions.csv', 'Shares.csv', 'Comments.csv', 'Job Applications.csv', 'messages.csv'];
  const missingHighValue = d.missingFiles.filter((f) =>
    HIGH_VALUE.some((h) => f.toLowerCase().includes(h.toLowerCase())),
  );

  return {
    overview: {
      totalConnections: d.connections.length,
      totalInvitations: d.invitations.length,
      totalShares: d.shares.length,
      totalReactions: d.reactions.length,
      totalComments: d.comments.length,
      totalMessages: d.messages.length,
      totalSearches: d.searchQueries.length,
      totalJobApps: d.jobApplications.length,
      totalLearningItems: d.learning.length,
      totalAdClicks: d.adClicks,
      accountAgeYears,
      activeYears,
      headline: d.profile?.headline,
      industry: d.profile?.industry,
      location: d.profile?.geoLocation,
      name: d.profile ? `${d.profile.firstName ?? ''} ${d.profile.lastName ?? ''}`.trim() : undefined,
    },
    network: {
      connectionsByMonth,
      topCompanies,
      topPositions,
      invitationDirection,
      invitationsByMonth,
      companyFollows: d.companyFollows.length,
      memberFollows: d.memberFollows.length,
      importedContacts: d.importedContacts,
    },
    content: {
      sharesByMonth, reactionsByMonth, commentsByMonth,
      reactionTypes, topHashtags, topSharedDomains,
      weekdayActivity, hourActivity, engagementStyle,
    },
    career: {
      jobAppsByMonth, topAppliedCompanies, topAppliedTitles,
      topSearchTerms, searchesByMonth, skills, positions, averageTenureMonths,
    },
    messaging: {
      messagesByMonth, topConversations, inbound, outbound,
      uniqueConversations: conversationIds.size,
      longestSilenceDays: longestSilenceDays !== undefined ? Math.round(longestSilenceDays) : undefined,
      medianContentLength: medianContentLength !== undefined ? Math.round(medianContentLength) : undefined,
    },
    ads: {
      adClicks: d.adClicks,
      lanAdsEngagement: d.lanAdsEngagement,
      topInferenceCategories: inferenceCounts,
      topAdTargeting: adTargetingCounts,
    },
    security: {
      accountAgeYears,
      loginsCount: d.logins.length,
      challengesCount: d.securityChallenges.length,
      uniqueLoginCountries,
      distinctUserAgents,
    },
    scores: {
      networkGrowth: {
        last12Months: last12,
        previous12Months: prev12,
        growthRatePct: growthRatePct != null ? Math.round(growthRatePct) : undefined,
        trend: growthTrend,
      },
      networkConcentration: {
        topCompanyShare: Math.round(topCompanyShare * 10) / 10,
        top5CompanyShare: Math.round(top5CompanyShare * 10) / 10,
        hhi: Math.round(hhi),
        verdict: concentrationVerdict,
      },
      contentConsistency: {
        activeSpanMonths,
        postingMonths,
        score: consistencyScore,
        verdict: consistencyVerdict,
      },
      jobSearchFunnel: {
        searches: searchesCount,
        saved: savedCount,
        applications: applicationsCount,
        searchToApplyRatio: searchToApplyRatio != null
          ? Math.round(searchToApplyRatio * 1000) / 1000
          : undefined,
      },
      applicationIntensity: {
        peakMonth: peakAppBucket?.key,
        peakCount: peakAppBucket?.count ?? 0,
        activeMonths: appActiveMonths,
        appsPerActiveMonth,
        verdict: appVerdict,
      },
      privacySecurity: {
        score: privacyScore,
        verdict: privacyVerdict,
        signals: privacySignals,
      },
      exportCoverage: {
        detected: detectedCount,
        total: totalKnown,
        pct: coveragePct,
        missingHighValue,
      },
    },
    findings,
  };
}
