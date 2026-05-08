import { useState } from 'react';
import { useStore } from '../store';
import OverviewTab from './tabs/OverviewTab';
import NetworkTab from './tabs/NetworkTab';
import ContentTab from './tabs/ContentTab';
import CareerTab from './tabs/CareerTab';
import JobsTab from './tabs/JobsTab';
import MessagingTab from './tabs/MessagingTab';
import AdsTab from './tabs/AdsTab';
import SecurityTab from './tabs/SecurityTab';
import ExportPanel from './ExportPanel';
import LeftNav, { NAV, type TabId } from './LeftNav';
import RightRail from './RightRail';
import { detectedFilesForTab } from '../lib/tabFiles';
import FilesUsedPopover from './FilesUsedPopover';
import AISummaryTab from './ai/AISummaryTab';
import CareerStrategyTab from './ai/CareerStrategyTab';
import NetworkLeverageTab from './ai/NetworkLeverageTab';
import PersonalBrandTab from './ai/PersonalBrandTab';
import JobSearchStrategyTab from './ai/JobSearchStrategyTab';
import ActionPlanTab from './ai/ActionPlanTab';
import BusinessOpportunitiesTab from './ai/BusinessOpportunitiesTab';

export default function Dashboard() {
  const insights = useStore((s) => s.insights);
  const parsed = useStore((s) => s.parsed);
  const fileName = useStore((s) => s.fileName);
  const [tab, setTab] = useState<TabId>('overview');
  if (!insights || !parsed) return null;

  const o = insights.overview;
  const activeLabel = NAV.find((n) => n.id === tab)?.label ?? '';
  const tabFiles = detectedFilesForTab(tab, parsed.detectedFiles);
  const totalDetected = parsed.detectedFiles.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)_260px] gap-4">
      {/* Left rail (sticky on large screens) */}
      <div className="lg:sticky lg:top-3 lg:self-start">
        <LeftNav
          tab={tab}
          setTab={setTab}
          name={o.name}
          headline={o.headline}
          location={o.location}
          profilePhotoUrl={parsed.profilePhotoUrl}
        />
      </div>

      {/* Center column */}
      <main className="min-w-0 space-y-4">
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
          <h2 className="text-base font-semibold text-slate-800">{activeLabel}</h2>
          <FilesUsedPopover
            activeLabel={activeLabel}
            files={tabFiles ?? parsed.detectedFiles}
            totalDetected={totalDetected}
            scope={tabFiles ? 'tab' : 'all'}
          />
        </div>
        {/* Direct insights */}
        {tab === 'overview' && (
          <OverviewTab
            ins={insights}
            fileName={fileName}
            detected={parsed.detectedFiles}
            missing={parsed.missingFiles}
            education={parsed.education}
          />
        )}
        {tab === 'network' && <NetworkTab ins={insights} memberFollows={parsed.memberFollows} />}
        {tab === 'content' && <ContentTab ins={insights} />}
        {tab === 'jobs' && (
          <JobsTab
            ins={insights}
            savedJobs={parsed.savedJobs}
            preferences={parsed.jobSeekerPreferences}
          />
        )}
        {tab === 'career' && (
          <CareerTab
            ins={insights}
            certifications={parsed.certifications}
            projects={parsed.projects}
            volunteering={parsed.volunteering}
            learning={parsed.learning}
            recommendationsGiven={parsed.recommendationsGiven}
            recommendationsReceived={parsed.recommendationsReceived}
          />
        )}
        {tab === 'messaging' && <MessagingTab ins={insights} />}
        {tab === 'ads' && <AdsTab ins={insights} />}
        {tab === 'security' && <SecurityTab ins={insights} />}

        {/* AI insights */}
        {tab === 'ai-summary' && <AISummaryTab />}
        {tab === 'ai-career' && <CareerStrategyTab onOpenGenerator={() => setTab('ai-summary')} />}
        {tab === 'ai-network' && <NetworkLeverageTab onOpenGenerator={() => setTab('ai-summary')} />}
        {tab === 'ai-brand' && <PersonalBrandTab onOpenGenerator={() => setTab('ai-summary')} />}
        {tab === 'ai-jobsearch' && <JobSearchStrategyTab onOpenGenerator={() => setTab('ai-summary')} />}
        {tab === 'ai-actionplan' && <ActionPlanTab onOpenGenerator={() => setTab('ai-summary')} />}
        {tab === 'ai-opportunities' && <BusinessOpportunitiesTab onOpenGenerator={() => setTab('ai-summary')} />}

        {/* Tools */}
        {tab === 'export' && <ExportPanel />}
      </main>

      {/* Right rail */}
      <div className="lg:sticky lg:top-3 lg:self-start">
        <RightRail
          ins={insights}
          fileName={fileName}
          detected={parsed.detectedFiles}
          missing={parsed.missingFiles}
        />
      </div>
    </div>
  );
}
