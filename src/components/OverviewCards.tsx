import { Users, MessageSquare, Send, ThumbsUp, MessageCircle, Briefcase, Search, GraduationCap } from 'lucide-react';
import type { DerivedInsights } from '../lib/insights';

export default function OverviewCards({ ins }: { ins: DerivedInsights }) {
  const o = ins.overview;
  const items = [
    { icon: <Users className="size-4" />, label: 'Connections', value: o.totalConnections },
    { icon: <Send className="size-4" />, label: 'Invitations', value: ins.network.invitationDirection.incoming + ins.network.invitationDirection.outgoing },
    { icon: <MessageSquare className="size-4" />, label: 'Messages', value: o.totalMessages },
    { icon: <ThumbsUp className="size-4" />, label: 'Reactions', value: o.totalReactions },
    { icon: <MessageCircle className="size-4" />, label: 'Comments', value: o.totalComments },
    { icon: <Briefcase className="size-4" />, label: 'Job Apps', value: o.totalJobApps },
    { icon: <Search className="size-4" />, label: 'Searches', value: o.totalSearches },
    { icon: <GraduationCap className="size-4" />, label: 'Learning', value: o.totalLearningItems },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <div key={it.label} className="card">
          <div className="flex items-center justify-between text-slate-500">
            <span className="stat-label">{it.label}</span>
            <span className="text-slate-400">{it.icon}</span>
          </div>
          <div className="stat tabular-nums mt-1">{(it.value ?? 0).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
