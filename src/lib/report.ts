import type { DerivedInsights } from './insights';
import type { LLMOutput } from './llm';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c] as string));

function svgBarChart(data: { label: string; value: number }[], title: string, opts?: { width?: number; height?: number }): string {
  const width = opts?.width ?? 720;
  const height = opts?.height ?? 220;
  const m = { top: 24, right: 12, bottom: 60, left: 40 };
  const innerW = width - m.left - m.right;
  const innerH = height - m.top - m.bottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = data.length ? innerW / data.length : innerW;
  const bars = data.map((d, i) => {
    const h = (d.value / max) * innerH;
    const x = m.left + i * bw + 2;
    const y = m.top + (innerH - h);
    return `<g><rect x="${x}" y="${y}" width="${Math.max(1, bw - 4)}" height="${h}" fill="#0b64c3" rx="2"/>` +
      `<title>${esc(d.label)}: ${esc(d.value)}</title></g>` +
      `<text x="${x + (bw - 4) / 2}" y="${height - m.bottom + 14}" font-size="10" text-anchor="end" transform="rotate(-35 ${x + (bw - 4) / 2} ${height - m.bottom + 14})" fill="#475569">${esc(d.label.slice(0, 20))}</text>`;
  }).join('');
  return `<figure style="margin:0 0 16px"><figcaption style="font-size:13px;color:#334155;margin-bottom:6px">${esc(title)}</figcaption>` +
    `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px">` +
    bars +
    `</svg></figure>`;
}

function listBlock(items: string[]): string {
  if (!items?.length) return '<p style="color:#64748b">No items.</p>';
  return `<ul style="margin:0 0 12px 20px;padding:0">${items.map((i) => `<li style="margin:4px 0">${esc(i)}</li>`).join('')}</ul>`;
}

function fmtPct(n?: number): string { return n == null ? '–' : `${n.toFixed(1)}%`; }
function fmtNum(n?: number): string { return n == null ? '–' : n.toLocaleString(); }

export function generateHtmlReport(ins: DerivedInsights, llm?: LLMOutput): string {
  const o = ins.overview;
  const generatedAt = new Date().toISOString().slice(0, 10);

  const overviewCards = [
    ['Connections', fmtNum(o.totalConnections)],
    ['Messages', fmtNum(o.totalMessages)],
    ['Shares', fmtNum(o.totalShares)],
    ['Reactions', fmtNum(o.totalReactions)],
    ['Comments', fmtNum(o.totalComments)],
    ['Job applications', fmtNum(o.totalJobApps)],
    ['Searches', fmtNum(o.totalSearches)],
    ['Learning items', fmtNum(o.totalLearningItems)],
  ].map(([l, v]) => `<div class="card"><div class="lbl">${esc(l)}</div><div class="val">${esc(v)}</div></div>`).join('');

  const sc = ins.scores;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const scoreCardsList: { label: string; value: string; sub: string }[] = [
    {
      label: 'Network growth',
      value: sc.networkGrowth.growthRatePct != null ? `${sc.networkGrowth.growthRatePct}%` : '—',
      sub: `${fmtNum(sc.networkGrowth.last12Months)} new in last 12 mo · ${fmtNum(sc.networkGrowth.previous12Months)} prior · ${cap(sc.networkGrowth.trend)}`,
    },
    {
      label: 'Network concentration',
      value: `${sc.networkConcentration.topCompanyShare.toFixed(1)}% top`,
      sub: `Top 5 share ${sc.networkConcentration.top5CompanyShare.toFixed(1)}% · ${cap(sc.networkConcentration.verdict)}`,
    },
    {
      label: 'Content consistency',
      value: `${sc.contentConsistency.score}/100`,
      sub: `${sc.contentConsistency.postingMonths}/${sc.contentConsistency.activeSpanMonths} months active · ${cap(sc.contentConsistency.verdict)}`,
    },
    {
      label: 'Job search funnel',
      value: `${fmtNum(sc.jobSearchFunnel.applications)} apps`,
      sub: `${fmtNum(sc.jobSearchFunnel.searches)} searches · ${fmtNum(sc.jobSearchFunnel.saved)} saved · ratio ${sc.jobSearchFunnel.searchToApplyRatio != null ? sc.jobSearchFunnel.searchToApplyRatio.toFixed(3) : '—'}`,
    },
    {
      label: 'Application intensity',
      value: cap(sc.applicationIntensity.verdict),
      sub: sc.applicationIntensity.peakMonth
        ? `Peak ${esc(sc.applicationIntensity.peakMonth)} (${sc.applicationIntensity.peakCount}) · ${sc.applicationIntensity.appsPerActiveMonth}/mo when active`
        : 'No application history',
    },
    {
      label: 'Privacy posture',
      value: `${sc.privacySecurity.score}/100`,
      sub: `${cap(sc.privacySecurity.verdict)}${sc.privacySecurity.signals.length ? ` · ${sc.privacySecurity.signals.length} signal${sc.privacySecurity.signals.length === 1 ? '' : 's'}` : ' · no concerning signals'}`,
    },
    {
      label: 'Export coverage',
      value: `${sc.exportCoverage.pct}%`,
      sub: `${sc.exportCoverage.detected}/${sc.exportCoverage.total} files${sc.exportCoverage.missingHighValue.length ? ` · ${sc.exportCoverage.missingHighValue.length} key file(s) missing` : ''}`,
    },
  ];
  const scoreCards = scoreCardsList
    .map((s) => `<div class="card score-card"><div class="lbl">${esc(s.label)}</div><div class="val">${esc(s.value)}</div><div class="sub">${esc(s.sub)}</div></div>`)
    .join('');
  const privacySignalsLine = sc.privacySecurity.signals.length
    ? `<p class="meta" style="margin-top:10px"><strong>Privacy signals:</strong> ${esc(sc.privacySecurity.signals.join(' · '))}</p>`
    : '';

  const findings = ins.findings.map((f) => `
    <div class="finding p-${f.priority}">
      <div class="finding-head"><span class="pill">${esc(f.priority.toUpperCase())}</span><h4>${esc(f.title)}</h4></div>
      <p><strong>Evidence:</strong> ${esc(f.evidence)}</p>
      <p><strong>Recommendation:</strong> ${esc(f.recommendation)}</p>
    </div>
  `).join('');

  const llmBlocks = llm ? `
    <section>
      <h2>Executive summary</h2>
      <p>${esc(llm.executiveSummary)}</p>
    </section>
    <section>
      <h2>Top insights</h2>
      ${llm.topInsights.map((i) => `
        <div class="finding p-${i.priority}">
          <div class="finding-head"><span class="pill">${esc(i.priority.toUpperCase())}</span><h4>${esc(i.title)}</h4></div>
          <p><strong>Evidence:</strong> ${esc(i.evidence)}</p>
          <p><strong>Recommendation:</strong> ${esc(i.recommendation)}</p>
        </div>`).join('')}
    </section>
    <section>
      <h2>Action plans</h2>
      <div class="grid-2">
        <div><h3>Network</h3>${listBlock(llm.networkActions)}</div>
        <div><h3>Career</h3>${listBlock(llm.careerActions)}</div>
        <div><h3>Content</h3>${listBlock(llm.contentActions)}</div>
        <div><h3>Privacy notes</h3>${listBlock(llm.privacyNotes)}</div>
      </div>
    </section>
    ${llm.careerStrategy ? `
    <section>
      <h2>Career strategy</h2>
      <p>${esc(llm.careerStrategy.summary)}</p>
      <h3>Trajectory</h3>
      <p>${esc(llm.careerStrategy.trajectory)}</p>
      <div class="grid-2">
        <div><h3>Plausible next roles</h3>${listBlock(llm.careerStrategy.nextRoles)}</div>
        <div><h3>Risks</h3>${listBlock(llm.careerStrategy.risks)}</div>
      </div>
    </section>` : ''}
    ${llm.networkLeverage ? `
    <section>
      <h2>Network leverage</h2>
      <p>${esc(llm.networkLeverage.summary)}</p>
      <div class="grid-2">
        <div><h3>Strongest segments</h3>${listBlock(llm.networkLeverage.strongestSegments)}</div>
        <div><h3>Relationship gaps</h3>${listBlock(llm.networkLeverage.gaps)}</div>
      </div>
      <h3>Outreach themes</h3>
      ${listBlock(llm.networkLeverage.outreachThemes)}
    </section>` : ''}
    ${llm.personalBrand ? `
    <section>
      <h2>Personal brand</h2>
      <p>${esc(llm.personalBrand.summary)}</p>
      <div class="grid-2">
        <div><h3>How you're likely perceived</h3>${listBlock(llm.personalBrand.perceived)}</div>
        <div><h3>Recommended pillars</h3>${listBlock(llm.personalBrand.recommendedPillars)}</div>
      </div>
      <h3>Cadence</h3>
      <p>${esc(llm.personalBrand.cadence)}</p>
    </section>` : ''}
    ${llm.jobSearchStrategy ? `
    <section>
      <h2>Job search strategy</h2>
      <p><strong>Intent:</strong> ${esc(llm.jobSearchStrategy.intent)}</p>
      <p>${esc(llm.jobSearchStrategy.rationale)}</p>
      <div class="grid-2">
        <div><h3>Target roles</h3>${listBlock(llm.jobSearchStrategy.targetRoles)}</div>
        <div><h3>Refinements</h3>${listBlock(llm.jobSearchStrategy.refinements)}</div>
      </div>
    </section>` : ''}
    ${llm.actionPlan30Day?.length ? `
    <section>
      <h2>30-day action plan</h2>
      ${[...llm.actionPlan30Day].sort((a, b) => a.week - b.week).map((w) => `
        <h3>Week ${w.week}: ${esc(w.focus)}</h3>
        ${listBlock(w.actions)}
      `).join('')}
    </section>` : ''}
    ${llm.businessOpportunities?.length ? `
    <section>
      <h2>Business opportunities</h2>
      ${llm.businessOpportunities.map((op) => `
        <h3>${esc(op.theme)}</h3>
        <p><strong>Evidence:</strong> ${esc(op.evidence)}</p>
        ${listBlock(op.suggestedActions)}
      `).join('')}
    </section>` : ''}
    ${llm.reportSections?.length ? `
    <section>
      <h2>Narrative</h2>
      ${llm.reportSections.map((s) => `<h3>${esc(s.heading)}</h3><p>${esc(s.body)}</p>`).join('')}
    </section>` : ''}
  ` : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>LinkedIn Data Insights Report</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  :root { color-scheme: light; }
  body { font: 15px/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#0f172a; background:#f8fafc; margin:0; padding:32px; }
  .container { max-width: 980px; margin: 0 auto; }
  header.hero { border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { margin:0 0 4px; font-size: 26px; }
  h2 { margin: 28px 0 12px; font-size: 20px; border-left: 4px solid #0b64c3; padding-left: 10px; }
  h3 { margin: 16px 0 8px; font-size: 16px; color:#0f172a; }
  h4 { margin: 0; font-size: 15px; }
  p { margin: 8px 0; }
  section { background: #fff; border:1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  .meta { color:#64748b; font-size:13px; }
  .grid-cards { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
  .grid-scores { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .score-card .sub { color:#64748b; font-size: 12px; margin-top: 4px; }
  .grid-2 { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; }
  .card { background: #fff; border:1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
  .card .lbl { color:#64748b; font-size: 11px; letter-spacing:.05em; text-transform:uppercase; }
  .card .val { font-size: 22px; font-weight: 600; margin-top: 4px; color:#084a90; }
  .pill { background:#e2e8f0; color:#0f172a; border-radius: 999px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
  .finding { border:1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 10px; background:#fff; }
  .finding-head { display:flex; gap:10px; align-items:center; margin-bottom: 6px; }
  .p-high .pill { background:#fee2e2; color:#991b1b; }
  .p-medium .pill { background:#fef3c7; color:#92400e; }
  .p-low .pill { background:#dcfce7; color:#166534; }
  footer { color:#64748b; font-size:12px; margin-top: 24px; text-align:center; }
  @media (max-width: 720px) {
    .grid-cards { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .grid-scores { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .grid-2 { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="container">
  <header class="hero">
    <h1>LinkedIn Data Insights Report</h1>
    <div class="meta">
      Generated ${esc(generatedAt)} · ${o.name ? esc(o.name) + ' · ' : ''}${o.headline ? esc(o.headline) + ' · ' : ''}${o.industry ? esc(o.industry) : ''}
    </div>
    <div class="meta" style="margin-top:6px">This report contains aggregated metrics and narrative only. No raw rows, message bodies, IPs, or contact identifiers are embedded.</div>
  </header>

  <section>
    <h2>Overview</h2>
    <div class="grid-cards">${overviewCards}</div>
    <p class="meta" style="margin-top:10px">Account age: ${o.accountAgeYears ? o.accountAgeYears.toFixed(1) + ' years' : '–'} · Active span: ${o.activeYears} years</p>
  </section>

  <section>
    <h2>Health scores</h2>
    <div class="grid-scores">${scoreCards}</div>
    ${privacySignalsLine}
  </section>

  ${llmBlocks}

  <section>
    <h2>Deterministic findings</h2>
    ${findings || '<p>No notable findings.</p>'}
  </section>

  <section>
    <h2>Network</h2>
    ${svgBarChart(ins.network.connectionsByMonth.map((b) => ({ label: b.key, value: b.count })), 'Connections accepted by month')}
    ${svgBarChart(ins.network.topCompanies.map((c) => ({ label: c.label, value: c.value })), 'Top companies among your connections')}
    <p class="meta">Imported contacts: ${fmtNum(ins.network.importedContacts)} · Companies followed: ${fmtNum(ins.network.companyFollows)} · Members followed: ${fmtNum(ins.network.memberFollows)} · Invitations: ${fmtNum(ins.network.invitationDirection.incoming + ins.network.invitationDirection.outgoing)} (out: ${ins.network.invitationDirection.outgoing}, in: ${ins.network.invitationDirection.incoming})</p>
  </section>

  <section>
    <h2>Content engagement</h2>
    ${svgBarChart(ins.content.sharesByMonth.map((b) => ({ label: b.key, value: b.count })), 'Shares by month')}
    ${svgBarChart(ins.content.reactionsByMonth.map((b) => ({ label: b.key, value: b.count })), 'Reactions by month')}
    ${svgBarChart(ins.content.weekdayActivity.map((w) => ({ label: w.weekday, value: w.count })), 'Activity by weekday')}
    <p class="meta">Engagement style: <strong>${esc(ins.content.engagementStyle)}</strong>. Top hashtags: ${ins.content.topHashtags.slice(0, 8).map((t) => esc(t.label)).join(', ') || '—'}.</p>
  </section>

  <section>
    <h2>Career &amp; jobs</h2>
    ${svgBarChart(ins.career.jobAppsByMonth.map((b) => ({ label: b.key, value: b.count })), 'Job applications by month')}
    ${svgBarChart(ins.career.topAppliedCompanies.map((c) => ({ label: c.label, value: c.value })), 'Top companies applied to')}
    ${svgBarChart(ins.career.topAppliedTitles.map((t) => ({ label: t.label, value: t.value })), 'Top job titles applied to')}
    <p class="meta">Average tenure: ${ins.career.averageTenureMonths != null ? `${ins.career.averageTenureMonths} months` : '—'} · Skills tracked: ${fmtNum(ins.career.skills.length)}</p>
  </section>

  <section>
    <h2>Messaging (aggregate only)</h2>
    ${svgBarChart(ins.messaging.messagesByMonth.map((b) => ({ label: b.key, value: b.count })), 'Messages by month')}
    <p class="meta">Unique conversations: ${fmtNum(ins.messaging.uniqueConversations)} · Median message length: ${fmtNum(ins.messaging.medianContentLength)} chars · Longest silence: ${fmtNum(ins.messaging.longestSilenceDays)} days</p>
  </section>

  <section>
    <h2>Ads &amp; inferences</h2>
    <p>Ads clicked: <strong>${fmtNum(ins.ads.adClicks)}</strong> · LAN ads engagement: <strong>${fmtNum(ins.ads.lanAdsEngagement)}</strong></p>
    <h3>Top inference categories</h3>${listBlock(ins.ads.topInferenceCategories.map((c) => `${c.label} (${c.value})`))}
  </section>

  <section>
    <h2>Account &amp; security</h2>
    <p>Account age: ${ins.security.accountAgeYears ? ins.security.accountAgeYears.toFixed(1) + ' years' : '—'} · Logins: ${fmtNum(ins.security.loginsCount)} · Security challenges: ${fmtNum(ins.security.challengesCount)} · Distinct user agents: ${fmtNum(ins.security.distinctUserAgents)}</p>
    <p class="meta">IPs, phone numbers, emails, and verification details are intentionally excluded from this report.</p>
  </section>

  <footer>Generated by LinkedIn Data Visualizer · client-side only · ${esc(fmtPct(undefined))}${''}</footer>
</div>
</body>
</html>`;
}

export function downloadHtml(filename: string, html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}
