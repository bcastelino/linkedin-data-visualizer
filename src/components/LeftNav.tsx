import { useState } from 'react';
import {
  Home, Users, Newspaper, Briefcase, MessageSquare, Megaphone, ShieldCheck,
  Sparkles, Download, Target, CalendarCheck,
  type LucideIcon,
} from 'lucide-react';

export type TabId =
  // Direct insights
  | 'overview' | 'network' | 'content' | 'jobs' | 'career' | 'messaging' | 'ads' | 'security'
  // AI insights
  | 'ai-profile' | 'ai-jobsearch' | 'ai-actionplan'
  // Tools
  | 'export';

export interface NavItem { id: TabId; label: string; icon: LucideIcon }
export interface NavGroup { id: 'direct' | 'ai' | 'tools'; title: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'direct',
    title: 'Direct Insights',
    items: [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'network', label: 'Network', icon: Users },
      { id: 'content', label: 'Content', icon: Newspaper },
      { id: 'jobs', label: 'Jobs', icon: Target },
      { id: 'career', label: 'Career', icon: Briefcase },
      { id: 'messaging', label: 'Messaging', icon: MessageSquare },
      { id: 'ads', label: 'Ads & inferences', icon: Megaphone },
      { id: 'security', label: 'Account & security', icon: ShieldCheck },
    ],
  },
  {
    id: 'ai',
    title: 'AI Insights',
    items: [
      { id: 'ai-profile', label: 'Profile optimizer', icon: Sparkles },
      { id: 'ai-jobsearch', label: 'Job search strategy', icon: Target },
      { id: 'ai-actionplan', label: '30-day action plan', icon: CalendarCheck },
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    items: [
      { id: 'export', label: 'Export report', icon: Download },
    ],
  },
];

// Flattened list, useful for label lookups
export const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export default function LeftNav({ tab, setTab, name, headline, location, profilePhotoUrl }: {
  tab: TabId;
  setTab: (id: TabId) => void;
  name?: string;
  headline?: string;
  location?: string;
  profilePhotoUrl?: string;
}) {
  const initials = (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || 'in';
  const [photoOk, setPhotoOk] = useState(!!profilePhotoUrl);
  return (
    <aside className="space-y-3">
      {/* Profile card (LinkedIn-style) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="h-14 bg-gradient-to-r from-brand-700 via-brand-500 to-brand-200" />
        <div className="px-4 pb-4 -mt-7">
          {profilePhotoUrl && photoOk ? (
            <img
              src={profilePhotoUrl}
              alt={name ? `${name}'s profile photo` : 'Profile photo'}
              className="size-14 rounded-full bg-white border-2 border-white shadow object-cover"
              onError={() => setPhotoOk(false)}
            />
          ) : (
            <div className="size-14 rounded-full bg-white border-2 border-white shadow grid place-items-center text-brand-700 font-bold text-lg">
              {initials}
            </div>
          )}
          <div className="mt-2">
            <div className="font-semibold text-slate-900 leading-tight truncate" title={name}>{name || 'Your LinkedIn data'}</div>
            {headline && <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">{headline}</div>}
            {location && <div className="text-xs text-slate-500 mt-1 truncate">{location}</div>}
          </div>
        </div>
      </div>

      {/* Grouped navigation */}
      <nav className="bg-white border border-slate-200 rounded-xl p-2">
        <div className="flex flex-col gap-1">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.id} className={gi > 0 ? 'mt-2 pt-2 border-t border-slate-100' : ''}>
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
              <ul className="flex flex-col">
                {group.items.map((n) => {
                  const Icon = n.icon;
                  const active = n.id === tab;
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => setTab(n.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active
                          ? 'bg-brand-50 text-brand-700 font-semibold border-l-4 border-brand-500 -ml-0.5'
                          : 'text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        <Icon className={`size-4 ${active ? 'text-brand-700' : 'text-slate-500'}`} />
                        <span className="truncate">{n.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
