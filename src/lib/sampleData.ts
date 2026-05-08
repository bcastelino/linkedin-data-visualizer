/**
 * Sample LinkedIn data export generator.
 *
 * Produces a fully synthetic ZIP that mimics LinkedIn's export structure so
 * users can try the app without uploading real data.
 *
 * Privacy / safety:
 *  - All names, companies, emails, phone numbers, IPs, and message contents
 *    are fictional. No real individuals are referenced.
 *  - Deterministic via a seeded PRNG so every download yields identical bytes
 *    (good for hashing / reproducibility).
 */
import JSZip from 'jszip';

// ---- Deterministic PRNG (mulberry32) -------------------------------------
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = rng(20260508);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const pickN = <T,>(arr: readonly T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  }
  return out;
};
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

// ---- Fake but plausible reference data -----------------------------------
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Drew', 'Sam',
  'Avery', 'Quinn', 'Reese', 'Hayden', 'Skyler', 'Rowan', 'Emerson', 'Sage',
  'Parker', 'Phoenix', 'Logan', 'Cameron', 'Dakota', 'Finley', 'Harper', 'Sloan',
  'Marlowe', 'Ellis', 'Blake', 'Robin', 'Sasha', 'Kai',
];
const LAST_NAMES = [
  'Sample', 'Demo', 'Example', 'Placeholder', 'Fictitious', 'Anon', 'Test',
  'Synthetic', 'Mockley', 'Imaginary', 'Stand-In', 'Filler', 'Generic', 'Dummy',
];
const COMPANIES = [
  'Acme Analytics', 'Globex Labs', 'Initech Systems', 'Umbrella Data', 'Hooli AI',
  'Massive Dynamic', 'Cyberdyne Research', 'Stark Industries', 'Wayne Tech',
  'Pied Piper', 'Vandelay Industries', 'Wonka Foods', 'Soylent Corp',
  'Dunder Mifflin', 'Tyrell Cybersystems', 'Aperture Science', 'Black Mesa',
  'Sirius Cybernetics', 'Weyland-Yutani', 'OCP Industries',
];
const TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Staff Engineer',
  'Data Engineer', 'AI Engineer', 'Machine Learning Engineer',
  'Data Scientist', 'Product Manager', 'Engineering Manager',
  'Developer Advocate', 'DevOps Engineer', 'Solutions Architect',
  'Research Scientist', 'Analytics Engineer', 'Platform Engineer',
];
const SKILLS = [
  'Python', 'TypeScript', 'SQL', 'React', 'Node.js', 'AWS', 'GCP', 'Docker',
  'Kubernetes', 'PyTorch', 'TensorFlow', 'LangChain', 'Snowflake', 'Airflow',
  'Spark', 'dbt', 'PostgreSQL', 'MongoDB', 'Kafka', 'Terraform',
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'MLOps',
  'Data Engineering', 'Statistics', 'A/B Testing', 'Prompt Engineering',
  'System Design',
];
const HASHTAGS = [
  '#ai', '#machinelearning', '#dataengineering', '#opensource', '#career',
  '#hiring', '#productivity', '#leadership', '#startups', '#python',
  '#typescript', '#llm', '#mlops', '#data', '#engineering',
];
const SEARCH_TERMS = [
  'data engineer', 'ai engineer', 'machine learning engineer', 'staff engineer',
  'product manager ai', 'remote data scientist', 'senior software engineer remote',
  'mlops engineer', 'analytics engineer', 'tech lead', 'engineering manager',
  'developer advocate', 'solutions architect ai', 'platform engineer',
];
const INDUSTRIES = ['Technology, Information and Internet', 'Software Development', 'IT Services and Consulting'];
const SCHOOLS = ['Sample State University', 'Demo Institute of Technology', 'Placeholder College'];
const DEGREES = ['B.S. Computer Science', 'M.S. Data Science', 'B.E. Information Technology'];
const CITIES = ['Dallas, Texas', 'Austin, Texas', 'San Francisco, California', 'New York, New York', 'Seattle, Washington'];

// ---- Date helpers --------------------------------------------------------
const NOW = new Date('2026-05-08T12:00:00Z');
function daysAgo(d: number): Date {
  return new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000);
}
function fmtLinkedInDate(d: Date): string {
  // LinkedIn-style: "DD MMM YYYY HH:MM:SS UTC"
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}
function fmtIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function fmtMonthYear(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ---- CSV helpers ---------------------------------------------------------
function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const head = headers.join(',');
  const body = rows.map((r) => headers.map((h) => csvEscape(r[h])).join(',')).join('\n');
  return `${head}\n${body}\n`;
}

// ---- File generators -----------------------------------------------------
function genProfile(): string {
  return toCsv(
    ['First Name', 'Last Name', 'Maiden Name', 'Address', 'Birth Date', 'Headline', 'Summary', 'Industry', 'Zip Code', 'Geo Location', 'Twitter Handles', 'Websites', 'Instant Messengers'],
    [{
      'First Name': 'Sample',
      'Last Name': 'User',
      'Maiden Name': '',
      'Address': '',
      'Birth Date': '',
      'Headline': 'AI Data Engineer | building privacy-first data tools',
      'Summary': 'This is a synthetic LinkedIn profile generated for demo purposes. All data shown is fictional.',
      'Industry': pick(INDUSTRIES),
      'Zip Code': '',
      'Geo Location': pick(CITIES),
      'Twitter Handles': '',
      'Websites': '',
      'Instant Messengers': '',
    }]
  );
}

function genConnections(): string {
  const rows: Record<string, unknown>[] = [];
  // ~180 connections across the last 36 months, weighted to recent
  for (let i = 0; i < 180; i++) {
    const monthsBack = Math.floor(Math.pow(rand(), 1.6) * 36);
    const date = daysAgo(monthsBack * 30 + randInt(0, 28));
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    rows.push({
      'First Name': first,
      'Last Name': last,
      'URL': `https://www.linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}-${randInt(100000, 999999)}`,
      'Email Address': '',
      'Company': pick(COMPANIES),
      'Position': pick(TITLES),
      'Connected On': fmtMonthYear(date),
    });
  }
  // LinkedIn prepends a "Notes:" preamble before the header row.
  const preamble = `Notes:\n"When exporting your connection data, you may notice that some of the data is missing from this file. We have removed information that you and your connections have not consented to share."\n\n`;
  return preamble + toCsv(
    ['First Name', 'Last Name', 'URL', 'Email Address', 'Company', 'Position', 'Connected On'],
    rows
  );
}

function genInvitations(): string {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < 95; i++) {
    const monthsBack = Math.floor(rand() * 36);
    const date = daysAgo(monthsBack * 30 + randInt(0, 28));
    const isOutgoing = rand() > 0.55;
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    rows.push({
      'From': isOutgoing ? 'Sample User' : `${first} ${last}`,
      'To': isOutgoing ? `${first} ${last}` : 'Sample User',
      'Sent At': fmtLinkedInDate(date),
      'Message': '',
      'Direction': isOutgoing ? 'OUTGOING' : 'INCOMING',
    });
  }
  return toCsv(['From', 'To', 'Sent At', 'Message', 'Direction'], rows);
}

function genShares(): string {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < 28; i++) {
    const monthsBack = Math.floor(rand() * 30);
    const date = daysAgo(monthsBack * 30 + randInt(0, 28));
    const tags = pickN(HASHTAGS, randInt(1, 3)).join(' ');
    rows.push({
      'Date': fmtLinkedInDate(date),
      'ShareLink': `https://www.linkedin.com/feed/update/urn:li:activity:${randInt(7000000000000000000, 7400000000000000000)}`,
      'ShareCommentary': `Reflections on building privacy-first data tooling. ${tags}`,
      'SharedUrl': rand() > 0.6 ? `https://example.com/post-${i}` : '',
      'MediaUrl': '',
      'MediaType': rand() > 0.7 ? 'IMAGE' : '',
      'Visibility': 'MEMBER_NETWORK',
    });
  }
  return toCsv(
    ['Date', 'ShareLink', 'ShareCommentary', 'SharedUrl', 'MediaUrl', 'MediaType', 'Visibility'],
    rows
  );
}

function genReactions(): string {
  const types = ['LIKE', 'PRAISE', 'EMPATHY', 'INTEREST', 'APPRECIATION', 'MAYBE'];
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < 320; i++) {
    const monthsBack = Math.floor(rand() * 30);
    const date = daysAgo(monthsBack * 30 + randInt(0, 28));
    rows.push({
      'Date': fmtLinkedInDate(date),
      'Type': pick(types),
      'Link': `https://www.linkedin.com/feed/update/urn:li:activity:${randInt(7000000000000000000, 7400000000000000000)}`,
    });
  }
  return toCsv(['Date', 'Type', 'Link'], rows);
}

function genComments(): string {
  const samples = [
    'Great point — would love to hear more about the rollout.',
    'Bookmarked. Thanks for sharing.',
    'Curious how this compares with the prior approach.',
    'This resonates. Similar experience on my side.',
    'Useful framing, especially the privacy angle.',
  ];
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < 45; i++) {
    const monthsBack = Math.floor(rand() * 30);
    const date = daysAgo(monthsBack * 30 + randInt(0, 28));
    rows.push({
      'Date': fmtLinkedInDate(date),
      'Link': `https://www.linkedin.com/feed/update/urn:li:activity:${randInt(7000000000000000000, 7400000000000000000)}`,
      'Message': pick(samples),
    });
  }
  return toCsv(['Date', 'Link', 'Message'], rows);
}

function genJobApplications(): string {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < 38; i++) {
    const monthsBack = Math.floor(rand() * 18);
    const date = daysAgo(monthsBack * 30 + randInt(0, 28));
    rows.push({
      'Application Date': fmtLinkedInDate(date),
      'Company Name': pick(COMPANIES),
      'Job Title': pick(TITLES),
      'Job Url': `https://www.linkedin.com/jobs/view/${randInt(3000000000, 4000000000)}`,
      'Contact Email': '',
      'Contact Phone Number': '',
      'Question And Answers': '',
      'Resume Name': 'Sample_User_Resume.pdf',
    });
  }
  return toCsv(
    ['Application Date', 'Company Name', 'Job Title', 'Job Url', 'Contact Email', 'Contact Phone Number', 'Question And Answers', 'Resume Name'],
    rows
  );
}

function genSearchQueries(): string {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < 280; i++) {
    const monthsBack = Math.floor(rand() * 24);
    const date = daysAgo(monthsBack * 30 + randInt(0, 28));
    rows.push({
      'Time': fmtLinkedInDate(date),
      'Search Query': pick(SEARCH_TERMS),
    });
  }
  return toCsv(['Time', 'Search Query'], rows);
}

function genSkills(): string {
  return toCsv(['Name'], pickN(SKILLS, 22).map((s) => ({ Name: s })));
}

function genPositions(): string {
  // 4 positions over the last 6 years
  const positions = [
    { months: 5, current: true, title: 'AI Data Engineer', company: pick(COMPANIES) },
    { months: 14, current: false, title: 'Data Engineer', company: pick(COMPANIES) },
    { months: 22, current: false, title: 'Analytics Engineer', company: pick(COMPANIES) },
    { months: 30, current: false, title: 'Data Analyst', company: pick(COMPANIES) },
  ];
  let cursor = 0;
  const rows = positions.map((p) => {
    const finished = p.current ? null : daysAgo(cursor * 30);
    cursor += p.months;
    const started = daysAgo(cursor * 30);
    return {
      'Company Name': p.company,
      'Title': p.title,
      'Description': 'Synthetic role description for demo purposes.',
      'Location': pick(CITIES),
      'Started On': fmtMonthYear(started),
      'Finished On': finished ? fmtMonthYear(finished) : '',
    };
  });
  return toCsv(
    ['Company Name', 'Title', 'Description', 'Location', 'Started On', 'Finished On'],
    rows
  );
}

function genEducation(): string {
  return toCsv(
    ['School Name', 'Start Date', 'End Date', 'Notes', 'Degree Name', 'Activities'],
    [
      { 'School Name': pick(SCHOOLS), 'Start Date': '2020', 'End Date': '2022', 'Notes': '', 'Degree Name': pick(DEGREES), 'Activities': 'Synthetic activity placeholder.' },
      { 'School Name': pick(SCHOOLS), 'Start Date': '2016', 'End Date': '2020', 'Notes': '', 'Degree Name': pick(DEGREES), 'Activities': '' },
    ]
  );
}

function genMessages(): string {
  // Metadata + length only — no real bodies. The parser already drops bodies,
  // but we still keep contents short and fictional for safety.
  const rows: Record<string, unknown>[] = [];
  const conversationCount = 40;
  for (let c = 0; c < conversationCount; c++) {
    const convoId = `urn:li:conversation:${randInt(7000000000000000000, 7400000000000000000)}`;
    const partnerFirst = pick(FIRST_NAMES);
    const partnerLast = pick(LAST_NAMES);
    const partner = `${partnerFirst} ${partnerLast}`;
    const subject = pick(['Quick question', 'Following up', 'Opportunity to chat', 'Hi from a recruiter', 'Re: your post', '']);
    const messageCount = randInt(2, 12);
    for (let m = 0; m < messageCount; m++) {
      const monthsBack = Math.floor(rand() * 24);
      const date = daysAgo(monthsBack * 30 + randInt(0, 28));
      const fromMe = rand() > 0.55;
      rows.push({
        'CONVERSATION ID': convoId,
        'CONVERSATION TITLE': subject,
        'FROM': fromMe ? 'Sample User' : partner,
        'SENDER PROFILE URL': fromMe ? '' : `https://www.linkedin.com/in/${partnerFirst.toLowerCase()}-${partnerLast.toLowerCase()}`,
        'TO': fromMe ? partner : 'Sample User',
        'RECIPIENT PROFILE URLS': '',
        'DATE': fmtLinkedInDate(date),
        'SUBJECT': subject,
        'CONTENT': '[redacted demo content]',
        'FOLDER': 'INBOX',
      });
    }
  }
  return toCsv(
    ['CONVERSATION ID', 'CONVERSATION TITLE', 'FROM', 'SENDER PROFILE URL', 'TO', 'RECIPIENT PROFILE URLS', 'DATE', 'SUBJECT', 'CONTENT', 'FOLDER'],
    rows
  );
}

function genLogins(): string {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
    'LinkedIn/9.0 (iPhone; iOS 17.0)',
  ];
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < 65; i++) {
    const monthsBack = Math.floor(rand() * 24);
    const date = daysAgo(monthsBack * 30 + randInt(0, 28));
    rows.push({
      'Login Date': fmtLinkedInDate(date),
      'IP Address': '203.0.113.10', // RFC 5737 documentation range
      'User Agent': pick(agents),
      'Login Type': pick(['SUCCESS', 'SUCCESS', 'SUCCESS', 'CHALLENGE_PASSED']),
    });
  }
  return toCsv(['Login Date', 'IP Address', 'User Agent', 'Login Type'], rows);
}

function genInferences(): string {
  // LinkedIn formats this as a single row with categorized columns.
  return toCsv(
    [
      'Member Age', 'Gender', 'Age Range', 'Industry', 'Job Function', 'Job Seniority',
      'Member Skills', 'Interests', 'Degree', 'Field of Study', 'Education End Year',
    ],
    [{
      'Member Age': '25-34',
      'Gender': 'Unknown',
      'Age Range': '25-34',
      'Industry': 'Software Development',
      'Job Function': 'Engineering',
      'Job Seniority': 'Senior',
      'Member Skills': 'Python, SQL, Machine Learning, Data Engineering, AWS',
      'Interests': 'Artificial Intelligence, Open Source, Privacy, Career Development',
      'Degree': 'Master',
      'Field of Study': 'Computer Science',
      'Education End Year': '2022',
    }]
  );
}

function genCompanyFollows(): string {
  const rows: Record<string, unknown>[] = [];
  for (const company of pickN(COMPANIES, 12)) {
    const monthsBack = Math.floor(rand() * 36);
    const date = daysAgo(monthsBack * 30 + randInt(0, 28));
    rows.push({
      'Organization': company,
      'Followed On': fmtMonthYear(date),
    });
  }
  return toCsv(['Organization', 'Followed On'], rows);
}

function genAdsClicked(): string {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < 18; i++) {
    const monthsBack = Math.floor(rand() * 18);
    const date = daysAgo(monthsBack * 30 + randInt(0, 28));
    rows.push({
      'Ad clicked Date': fmtLinkedInDate(date),
      'Ad Title': `Try ${pick(['the new AI platform', 'our cloud product', 'this MLOps tool', 'enterprise analytics suite'])}`,
      'Company Name': pick(COMPANIES),
    });
  }
  return toCsv(['Ad clicked Date', 'Ad Title', 'Company Name'], rows);
}

// ---- Public API ----------------------------------------------------------
export async function generateSampleZipBlob(): Promise<Blob> {
  const zip = new JSZip();
  zip.file('Profile.csv', genProfile());
  zip.file('Connections.csv', genConnections());
  zip.file('Invitations.csv', genInvitations());
  zip.file('Company Follows.csv', genCompanyFollows());
  zip.file('Shares.csv', genShares());
  zip.file('Reactions.csv', genReactions());
  zip.file('Comments.csv', genComments());
  zip.file('Job Applications.csv', genJobApplications());
  zip.file('SearchQueries.csv', genSearchQueries());
  zip.file('Skills.csv', genSkills());
  zip.file('Positions.csv', genPositions());
  zip.file('Education.csv', genEducation());
  zip.file('messages.csv', genMessages());
  zip.file('Logins.csv', genLogins());
  zip.file('Inferences_about_you.csv', genInferences());
  zip.file('Ads Clicked.csv', genAdsClicked());

  // A tiny README inside the ZIP so users opening it manually understand it's fake.
  zip.file('SAMPLE_README.txt',
    'This ZIP is a synthetic LinkedIn data export generated by the LinkedIn Data\n' +
    'Visualizer for demo purposes. All names, companies, jobs, messages, and\n' +
    'logins are fictional. No real individuals are referenced.\n'
  );

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

export async function downloadSampleZip(filename = 'sample-linkedin-export.zip'): Promise<void> {
  const blob = await generateSampleZipBlob();
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
