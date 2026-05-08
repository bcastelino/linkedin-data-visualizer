import type { TabId } from '../components/LeftNav';

/**
 * Maps each Direct Insights tab to the canonical LinkedIn export file
 * names that contribute to it. File names match the values stored in
 * `ParsedExport.detectedFiles` (see KNOWN_FILES in src/lib/parse.ts).
 *
 * AI Insights tabs and Tools (Export) intentionally have no entry here;
 * they synthesize across all parsed data.
 */
export const TAB_FILES: Partial<Record<TabId, string[]>> = {
  overview: [
    'Profile.csv', 'Profile Summary.csv', 'Registration.csv', 'Education.csv',
    'Connections.csv', 'Shares.csv', 'Reactions.csv', 'Comments.csv',
    'Job Applications.csv', 'SearchQueries.csv', 'messages.csv',
  ],
  network: [
    'Connections.csv', 'Invitations.csv', 'ImportedContacts.csv',
    'Company Follows.csv', 'Member_Follows.csv',
  ],
  content: [
    'Shares.csv', 'Reactions.csv', 'Comments.csv', 'Votes.csv',
    'Saved_Items.csv', 'InstantReposts.csv', 'Rich_Media.csv',
    'Hashtag_Follows_*.csv',
  ],
  jobs: [
    'Job Applications.csv', 'Saved Jobs.csv',
    'Job Seeker Preferences.csv', 'SearchQueries.csv',
  ],
  career: [
    'Positions.csv', 'Skills.csv', 'Certifications.csv',
    'Projects.csv', 'Volunteering.csv', 'Learning.csv',
    'Recommendations_Given.csv', 'Recommendations_Received.csv',
  ],
  messaging: [
    'messages.csv',
  ],
  ads: [
    'Ads Clicked.csv', 'LAN Ads Engagement.csv',
    'Ad_Targeting.csv', 'Inferences_about_you.csv',
  ],
  security: [
    'Logins.csv', 'Security Challenges.csv', 'Registration.csv',
    'Email Addresses.csv', 'PhoneNumbers.csv',
  ],
};

/**
 * Returns the subset of detectedFiles that are relevant to the given tab.
 * Returns `undefined` when the tab is not file-scoped (AI tabs, Export).
 */
export function detectedFilesForTab(tab: TabId, detectedFiles: string[]): string[] | undefined {
  const wanted = TAB_FILES[tab];
  if (!wanted) return undefined;
  const wantedSet = new Set(wanted.map((s) => s.toLowerCase()));
  return detectedFiles.filter((f) => wantedSet.has(f.toLowerCase()));
}
