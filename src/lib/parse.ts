import type {
  ParsedExport, FileMap, ParseProgress,
  Connection, Invitation, Share, Reaction, Comment, Vote, SavedItem,
  JobApplication, SavedJob, SearchQuery, Skill, Position, Education,
  Certification, LearningItem, CompanyFollow, MemberFollow, Message,
  Inference, Profile, Login, SecurityChallenge, Recommendation,
  Project, VolunteeringEntry, JobSeekerPreference, RichMediaItem,
} from '../types';
import { findFile, listBasenames } from './zip';
import { parseCsv, parseDate } from './csv';

type Row = Record<string, string>;
const get = (r: Row, ...keys: string[]): string | undefined => {
  for (const k of keys) {
    const found = Object.keys(r).find((rk) => rk.toLowerCase() === k.toLowerCase());
    if (found && r[found] != null && r[found] !== '') return r[found];
  }
  return undefined;
};

// Files we know how to consume; we report these in detected/missing.
const KNOWN_FILES = [
  'Profile.csv', 'Profile Summary.csv', 'Connections.csv', 'Invitations.csv',
  'ImportedContacts.csv', 'Company Follows.csv', 'Member_Follows.csv',
  'Shares.csv', 'Reactions.csv', 'Comments.csv', 'Votes.csv', 'Saved_Items.csv',
  'InstantReposts.csv', 'Rich_Media.csv', 'Hashtag_Follows',
  'Job Applications.csv', 'Saved Jobs.csv', 'Job Seeker Preferences.csv',
  'SearchQueries.csv', 'Skills.csv', 'Positions.csv', 'Education.csv',
  'Certifications.csv', 'Projects.csv', 'Volunteering.csv', 'Learning.csv',
  'messages.csv', 'Ads Clicked.csv', 'LAN Ads Engagement.csv',
  'Ad_Targeting.csv', 'Inferences_about_you.csv',
  'Recommendations_Given.csv', 'Recommendations_Received.csv',
  'Logins.csv', 'Security Challenges.csv', 'Registration.csv',
  'Email Addresses.csv', 'PhoneNumbers.csv',
];

export async function parseExport(map: FileMap, onProgress?: (p: ParseProgress) => void): Promise<ParsedExport> {
  const step = (s: string, pct?: number) => onProgress?.({ step: s, pct });

  step('Inspecting files', 5);
  const allBasenames = new Set(listBasenames(map).map((s) => s.toLowerCase()));

  const result: ParsedExport = {
    connections: [], invitations: [], importedContacts: 0,
    companyFollows: [], memberFollows: [],
    shares: [], reactions: [], comments: [], votes: [], savedItems: [],
    hashtagFollows: [],
    jobApplications: [], savedJobs: [],
    searchQueries: [], skills: [], positions: [], education: [],
    certifications: [], projects: [], volunteering: [],
    jobSeekerPreferences: [], richMedia: [],
    learning: [], messages: [],
    adClicks: 0, lanAdsEngagement: 0, adTargeting: [], inferences: [],
    recommendationsGiven: [], recommendationsReceived: [],
    logins: [], securityChallenges: [],
    emailAddressCount: 0, phoneNumberCount: 0,
    detectedFiles: [], missingFiles: [],
  };

  // Profile
  step('Parsing profile', 10);
  const profileCsv = findFile(map, 'Profile.csv');
  if (profileCsv) {
    const rows = parseCsv(profileCsv);
    const r = rows[0];
    if (r) {
      const profile: Profile = {
        firstName: get(r, 'First Name'),
        lastName: get(r, 'Last Name'),
        headline: get(r, 'Headline'),
        summary: get(r, 'Summary'),
        industry: get(r, 'Industry'),
        geoLocation: get(r, 'Geo Location'),
        zipCode: get(r, 'Zip Code'),
        websites: get(r, 'Websites'),
      };
      result.profile = profile;
    }
  }
  const profileSummary = findFile(map, 'Profile Summary.csv');
  if (profileSummary) {
    const rows = parseCsv(profileSummary);
    result.profileSummary = rows.map((r) => get(r, 'Profile Summary')).filter(Boolean).join('\n');
  }

  // Connections
  step('Parsing connections', 18);
  const connCsv = findFile(map, 'Connections.csv');
  if (connCsv) {
    // LinkedIn often prepends a "Notes:" preamble before the header row.
    const cleaned = stripPreamble(connCsv, 'First Name');
    const rows = parseCsv(cleaned);
    result.connections = rows.map<Connection>((r) => ({
      firstName: get(r, 'First Name') ?? '',
      lastName: get(r, 'Last Name') ?? '',
      url: get(r, 'URL'),
      email: get(r, 'Email Address'),
      company: get(r, 'Company'),
      position: get(r, 'Position'),
      connectedOn: parseDate(get(r, 'Connected On')),
    }));
  }

  // Invitations
  step('Parsing invitations', 25);
  const invCsv = findFile(map, 'Invitations.csv');
  if (invCsv) {
    const rows = parseCsv(invCsv);
    result.invitations = rows.map<Invitation>((r) => ({
      from: get(r, 'From') ?? '',
      to: get(r, 'To') ?? '',
      sentAt: parseDate(get(r, 'Sent At')),
      message: get(r, 'Message'),
      direction: get(r, 'Direction'),
    }));
  }

  // ImportedContacts (count only)
  const imported = findFile(map, 'ImportedContacts.csv');
  if (imported) result.importedContacts = parseCsv(imported).length;

  // Follows
  const compFollows = findFile(map, 'Company Follows.csv');
  if (compFollows) {
    const rows = parseCsv(compFollows);
    result.companyFollows = rows.map<CompanyFollow>((r) => ({
      companyName: get(r, 'Organization', 'Company', 'Name'),
      followedOn: parseDate(get(r, 'Followed On', 'Date')),
    }));
  }
  const memFollows = findFile(map, 'Member_Follows.csv');
  if (memFollows) {
    const rows = parseCsv(memFollows);
    result.memberFollows = rows.map<MemberFollow>((r) => ({
      fullName: get(r, 'FullName', 'Full Name'),
      date: parseDate(get(r, 'Date')),
      status: get(r, 'Status'),
    }));
  }

  // Content
  step('Parsing content engagement', 35);
  const sharesCsv = findFile(map, 'Shares.csv');
  if (sharesCsv) {
    const rows = parseCsv(sharesCsv);
    result.shares = rows.map<Share>((r) => ({
      date: parseDate(get(r, 'Date')),
      shareLink: get(r, 'ShareLink'),
      commentary: get(r, 'ShareCommentary'),
      sharedUrl: get(r, 'SharedUrl'),
      mediaUrl: get(r, 'MediaUrl'),
      visibility: get(r, 'Visibility'),
    }));
  }
  const reactionsCsv = findFile(map, 'Reactions.csv');
  if (reactionsCsv) {
    const rows = parseCsv(reactionsCsv);
    result.reactions = rows.map<Reaction>((r) => ({
      date: parseDate(get(r, 'Date')),
      type: get(r, 'Type'),
      link: get(r, 'Link'),
    }));
  }
  const commentsCsv = findFile(map, 'Comments.csv');
  if (commentsCsv) {
    const rows = parseCsv(commentsCsv);
    result.comments = rows.map<Comment>((r) => ({
      date: parseDate(get(r, 'Date')),
      link: get(r, 'Link'),
      message: get(r, 'Message'),
    }));
  }
  const votesCsv = findFile(map, 'Votes.csv');
  if (votesCsv) {
    const rows = parseCsv(votesCsv);
    result.votes = rows.map<Vote>((r) => ({
      date: parseDate(get(r, 'Date')),
      link: get(r, 'Link'),
      optionText: get(r, 'OptionText'),
    }));
  }
  const savedItemsCsv = findFile(map, 'Saved_Items.csv');
  if (savedItemsCsv) {
    const rows = parseCsv(savedItemsCsv);
    result.savedItems = rows.map<SavedItem>((r) => ({
      savedItem: get(r, 'savedItem', 'Saved Item'),
      createdTime: parseDate(get(r, 'CreatedTime', 'Created Time')),
    }));
  }
  // Hashtag follows: filename includes member id suffix
  for (const [path, text] of map) {
    const base = path.split('/').pop() ?? path;
    if (/^hashtag_follows.*\.csv$/.test(base)) {
      const rows = parseCsv(text);
      for (const r of rows) {
        const tag = get(r, 'HashtagUrl', 'Hashtag', 'Name');
        if (tag) result.hashtagFollows.push(tag);
      }
    }
  }

  // Career
  step('Parsing career & jobs', 50);
  const jobAppsCsv = findFile(map, 'Job Applications.csv');
  if (jobAppsCsv) {
    const rows = parseCsv(jobAppsCsv);
    result.jobApplications = rows.map<JobApplication>((r) => ({
      applicationDate: parseDate(get(r, 'Application Date')),
      companyName: get(r, 'Company Name'),
      jobTitle: get(r, 'Job Title'),
      jobUrl: get(r, 'Job Url'),
    }));
  }
  const savedJobsCsv = findFile(map, 'Saved Jobs.csv');
  if (savedJobsCsv) {
    const rows = parseCsv(savedJobsCsv);
    result.savedJobs = rows.map<SavedJob>((r) => ({
      savedDate: parseDate(get(r, 'Saved Date')),
      jobUrl: get(r, 'Job Url'),
      jobTitle: get(r, 'Job Title'),
      companyName: get(r, 'Company Name'),
    }));
  }
  const searchCsv = findFile(map, 'SearchQueries.csv');
  if (searchCsv) {
    const rows = parseCsv(searchCsv);
    result.searchQueries = rows.map<SearchQuery>((r) => ({
      time: parseDate(get(r, 'Time')),
      query: get(r, 'Search Query') ?? '',
    })).filter((q) => q.query);
  }
  const skillsCsv = findFile(map, 'Skills.csv');
  if (skillsCsv) {
    const rows = parseCsv(skillsCsv);
    result.skills = rows.map<Skill>((r) => ({ name: get(r, 'Name') ?? '' })).filter((s) => s.name);
  }
  const positionsCsv = findFile(map, 'Positions.csv');
  if (positionsCsv) {
    const rows = parseCsv(positionsCsv);
    result.positions = rows.map<Position>((r) => ({
      companyName: get(r, 'Company Name'),
      title: get(r, 'Title'),
      description: get(r, 'Description'),
      location: get(r, 'Location'),
      startedOn: parseDate(get(r, 'Started On')),
      finishedOn: parseDate(get(r, 'Finished On')),
    }));
  }
  const eduCsv = findFile(map, 'Education.csv');
  if (eduCsv) {
    const rows = parseCsv(eduCsv);
    result.education = rows.map<Education>((r) => ({
      schoolName: get(r, 'School Name'),
      startDate: get(r, 'Start Date'),
      endDate: get(r, 'End Date'),
      notes: get(r, 'Notes'),
      degreeName: get(r, 'Degree Name'),
      activities: get(r, 'Activities'),
    }));
  }
  const certsCsv = findFile(map, 'Certifications.csv');
  if (certsCsv) {
    const rows = parseCsv(certsCsv);
    result.certifications = rows.map<Certification>((r) => ({
      name: get(r, 'Name'),
      authority: get(r, 'Authority'),
      startedOn: parseDate(get(r, 'Started On')),
      finishedOn: parseDate(get(r, 'Finished On')),
    }));
  }
  const projectsCsv = findFile(map, 'Projects.csv');
  if (projectsCsv) {
    const rows = parseCsv(projectsCsv);
    result.projects = rows.map<Project>((r) => ({
      title: get(r, 'Title', 'Name'),
      description: get(r, 'Description'),
      url: get(r, 'Url', 'URL'),
      startedOn: parseDate(get(r, 'Started On', 'Start Date')),
      finishedOn: parseDate(get(r, 'Finished On', 'End Date')),
    }));
  }
  const volCsv = findFile(map, 'Volunteering.csv');
  if (volCsv) {
    const rows = parseCsv(volCsv);
    result.volunteering = rows.map<VolunteeringEntry>((r) => ({
      companyName: get(r, 'Company Name', 'Organization'),
      role: get(r, 'Role', 'Title', 'Position'),
      cause: get(r, 'Cause'),
      description: get(r, 'Description'),
      startedOn: parseDate(get(r, 'Started On', 'Start Date')),
      finishedOn: parseDate(get(r, 'Finished On', 'End Date')),
    }));
  }
  const jspCsv = findFile(map, 'Job Seeker Preferences.csv');
  if (jspCsv) {
    const rows = parseCsv(jspCsv);
    const prefs: JobSeekerPreference[] = [];
    for (const r of rows) {
      for (const [k, v] of Object.entries(r)) {
        const value = String(v ?? '').trim();
        if (!value) continue;
        prefs.push({ key: k, value });
      }
    }
    result.jobSeekerPreferences = prefs;
  }
  const richCsv = findFile(map, 'Rich_Media.csv');
  if (richCsv) {
    const rows = parseCsv(richCsv);
    result.richMedia = rows.map<RichMediaItem>((r) => ({
      date: parseDate(get(r, 'Date')),
      type: get(r, 'Type', 'Media Type', 'Category'),
      url: get(r, 'Url', 'URL', 'Link', 'Media Link', 'Media URL', 'Source URL', 'Path', 'File Path'),
      description: get(r, 'Description', 'Caption', 'Title'),
    }));
    // Profile photo: LinkedIn's media link contains 'profile-display' for the
    // user's display photo. Use the most recent matching entry.
    const profileEntries = result.richMedia.filter(
      (m) => !!m.url && /profile-display/i.test(m.url),
    );
    if (profileEntries.length) {
      const latest = profileEntries.reduce((a, b) => {
        const at = a.date ? new Date(a.date).getTime() : 0;
        const bt = b.date ? new Date(b.date).getTime() : 0;
        return bt > at ? b : a;
      });
      result.profilePhotoUrl = latest.url;
    }
  }

  // Learning
  const learningCsv = findFile(map, 'Learning.csv');
  if (learningCsv) {
    const rows = parseCsv(learningCsv);
    result.learning = rows.map<LearningItem>((r) => ({
      contentTitle: get(r, 'Content Title'),
      contentDescription: get(r, 'Content Description'),
      contentType: get(r, 'Content Type'),
      lastWatched: parseDate(get(r, 'Content Last Watched Date (if viewed)', 'Last Watched')),
      completedAt: parseDate(get(r, 'Content Completed At (if completed)', 'Completed At')),
    }));
  }

  // Messages (sensitive: keep metadata + length only)
  step('Parsing messages (metadata only)', 65);
  const messagesCsv = findFile(map, 'messages.csv');
  if (messagesCsv) {
    const rows = parseCsv(messagesCsv);
    result.messages = rows.map<Message>((r) => {
      const content = get(r, 'CONTENT', 'Content') ?? '';
      return {
        conversationId: get(r, 'CONVERSATION ID', 'Conversation Id'),
        conversationTitle: get(r, 'CONVERSATION TITLE', 'Conversation Title'),
        from: get(r, 'FROM', 'From'),
        to: get(r, 'TO', 'To'),
        date: parseDate(get(r, 'DATE', 'Date')),
        subject: get(r, 'SUBJECT', 'Subject'),
        hasContent: content.trim().length > 0,
        contentLength: content.length,
        folder: get(r, 'FOLDER', 'Folder'),
      };
    });
  }

  // Ads
  step('Parsing ads & inferences', 78);
  const adsCsv = findFile(map, 'Ads Clicked.csv');
  if (adsCsv) result.adClicks = parseCsv(adsCsv).length;
  const lanCsv = findFile(map, 'LAN Ads Engagement.csv');
  if (lanCsv) result.lanAdsEngagement = parseCsv(lanCsv).length;
  const targCsv = findFile(map, 'Ad_Targeting.csv');
  if (targCsv) {
    const rows = parseCsv(targCsv);
    result.adTargeting = rows.flatMap<Inference>((r) =>
      Object.entries(r).map(([k, v]) => ({ category: k, value: String(v ?? '') }))
        .filter((x) => x.value && x.value.length < 5000),
    );
  }
  const inferCsv = findFile(map, 'Inferences_about_you.csv');
  if (inferCsv) {
    const rows = parseCsv(inferCsv);
    result.inferences = rows.flatMap<Inference>((r) =>
      Object.entries(r).map(([k, v]) => ({ category: k, value: String(v ?? '') }))
        .filter((x) => x.value),
    );
  }

  // Recommendations
  const recGiven = findFile(map, 'Recommendations_Given.csv');
  if (recGiven) {
    const rows = parseCsv(recGiven);
    result.recommendationsGiven = rows.map<Recommendation>((r) => ({
      firstName: get(r, 'First Name'),
      lastName: get(r, 'Last Name'),
      company: get(r, 'Company'),
      jobTitle: get(r, 'Job Title'),
      text: get(r, 'Text'),
      creationDate: parseDate(get(r, 'Creation Date')),
      status: get(r, 'Status'),
    }));
  }
  const recRec = findFile(map, 'Recommendations_Received.csv');
  if (recRec) {
    const rows = parseCsv(recRec);
    result.recommendationsReceived = rows.map<Recommendation>((r) => ({
      firstName: get(r, 'First Name'),
      lastName: get(r, 'Last Name'),
      company: get(r, 'Company'),
      jobTitle: get(r, 'Job Title'),
      text: get(r, 'Text'),
      creationDate: parseDate(get(r, 'Creation Date')),
      status: get(r, 'Status'),
    }));
  }

  // Account/security
  step('Parsing account & security', 88);
  const loginsCsv = findFile(map, 'Logins.csv');
  if (loginsCsv) {
    const rows = parseCsv(loginsCsv);
    result.logins = rows.map<Login>((r) => ({
      date: parseDate(get(r, 'Login Date', 'Date')),
      ipAddress: get(r, 'IP Address'),
      userAgent: get(r, 'User Agent'),
      loginType: get(r, 'Login Type'),
    }));
  }
  const secCsv = findFile(map, 'Security Challenges.csv');
  if (secCsv) {
    const rows = parseCsv(secCsv);
    result.securityChallenges = rows.map<SecurityChallenge>((r) => ({
      date: parseDate(get(r, 'Challenge Date')),
      ipAddress: get(r, 'IP Address'),
      country: get(r, 'Country'),
      type: get(r, 'Challenge Type'),
    }));
  }
  const regCsv = findFile(map, 'Registration.csv');
  if (regCsv) {
    const rows = parseCsv(regCsv);
    const r = rows[0];
    if (r) result.registration = { registeredAt: parseDate(get(r, 'Registered At')) };
  }
  const emailCsv = findFile(map, 'Email Addresses.csv');
  if (emailCsv) result.emailAddressCount = parseCsv(emailCsv).length;
  const phoneCsv = findFile(map, 'PhoneNumbers.csv');
  if (phoneCsv) result.phoneNumberCount = parseCsv(phoneCsv).length;

  // Detected vs missing report
  for (const known of KNOWN_FILES) {
    if (known === 'Hashtag_Follows') {
      const has = Array.from(allBasenames).some((b) => b.startsWith('hashtag_follows'));
      (has ? result.detectedFiles : result.missingFiles).push('Hashtag_Follows_*.csv');
      continue;
    }
    if (allBasenames.has(known.toLowerCase())) result.detectedFiles.push(known);
    else result.missingFiles.push(known);
  }

  step('Done', 100);
  return result;
}

function stripPreamble(text: string, headerStartsWith: string): string {
  // LinkedIn sometimes wraps the CSV with "Notes:" lines before the header.
  const lines = text.split(/\r?\n/);
  const idx = lines.findIndex((l) => l.toLowerCase().startsWith(headerStartsWith.toLowerCase()));
  if (idx > 0) return lines.slice(idx).join('\n');
  return text;
}
