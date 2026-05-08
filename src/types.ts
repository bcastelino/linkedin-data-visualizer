// Domain models for parsed LinkedIn data export.

export interface Connection {
  firstName: string;
  lastName: string;
  url?: string;
  email?: string;
  company?: string;
  position?: string;
  connectedOn?: Date;
}

export interface Invitation {
  from: string;
  to: string;
  sentAt?: Date;
  message?: string;
  direction?: 'INCOMING' | 'OUTGOING' | string;
}

export interface Share {
  date?: Date;
  shareLink?: string;
  commentary?: string;
  sharedUrl?: string;
  mediaUrl?: string;
  visibility?: string;
}

export interface Reaction {
  date?: Date;
  type?: string;
  link?: string;
}

export interface Comment {
  date?: Date;
  link?: string;
  message?: string;
}

export interface Vote {
  date?: Date;
  link?: string;
  optionText?: string;
}

export interface SavedItem {
  savedItem?: string;
  createdTime?: Date;
}

export interface JobApplication {
  applicationDate?: Date;
  companyName?: string;
  jobTitle?: string;
  jobUrl?: string;
}

export interface SavedJob {
  savedDate?: Date;
  jobUrl?: string;
  jobTitle?: string;
  companyName?: string;
}

export interface SearchQuery {
  time?: Date;
  query: string;
}

export interface Skill {
  name: string;
}

export interface Position {
  companyName?: string;
  title?: string;
  description?: string;
  location?: string;
  startedOn?: Date;
  finishedOn?: Date;
}

export interface Education {
  schoolName?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  degreeName?: string;
  activities?: string;
}

export interface Certification {
  name?: string;
  authority?: string;
  startedOn?: Date;
  finishedOn?: Date;
}

export interface LearningItem {
  contentTitle?: string;
  contentDescription?: string;
  contentType?: string;
  lastWatched?: Date;
  completedAt?: Date;
}

export interface CompanyFollow {
  companyName?: string;
  followedOn?: Date;
}

export interface MemberFollow {
  fullName?: string;
  date?: Date;
  status?: string;
}

export interface Message {
  conversationId?: string;
  conversationTitle?: string;
  from?: string;
  to?: string;
  date?: Date;
  subject?: string;
  hasContent?: boolean;
  contentLength?: number;
  folder?: string;
}

export interface AdClick {
  date?: Date;
  campaign?: string;
  advertiser?: string;
  raw?: Record<string, string>;
}

export interface Inference {
  category?: string;
  value?: string;
}

export interface Profile {
  firstName?: string;
  lastName?: string;
  headline?: string;
  summary?: string;
  industry?: string;
  geoLocation?: string;
  zipCode?: string;
  websites?: string;
}

export interface Login {
  date?: Date;
  ipAddress?: string;
  userAgent?: string;
  loginType?: string;
}

export interface SecurityChallenge {
  date?: Date;
  ipAddress?: string;
  country?: string;
  type?: string;
}

export interface Recommendation {
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  text?: string;
  creationDate?: Date;
  status?: string;
}

export interface Project {
  title?: string;
  description?: string;
  url?: string;
  startedOn?: Date;
  finishedOn?: Date;
}

export interface VolunteeringEntry {
  companyName?: string;
  role?: string;
  cause?: string;
  description?: string;
  startedOn?: Date;
  finishedOn?: Date;
}

export interface RichMediaItem {
  date?: Date;
  type?: string;
  url?: string;
  description?: string;
}

export interface JobSeekerPreference {
  key: string;
  value: string;
}

export interface ParsedExport {
  // raw collections
  profile?: Profile;
  profileSummary?: string;
  connections: Connection[];
  invitations: Invitation[];
  importedContacts: number; // count only - sensitive
  companyFollows: CompanyFollow[];
  memberFollows: MemberFollow[];
  shares: Share[];
  reactions: Reaction[];
  comments: Comment[];
  votes: Vote[];
  savedItems: SavedItem[];
  hashtagFollows: string[];
  jobApplications: JobApplication[];
  savedJobs: SavedJob[];
  searchQueries: SearchQuery[];
  skills: Skill[];
  positions: Position[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  volunteering: VolunteeringEntry[];
  jobSeekerPreferences: JobSeekerPreference[];
  richMedia: RichMediaItem[];
  profilePhotoUrl?: string;
  learning: LearningItem[];
  messages: Message[];
  adClicks: number;
  lanAdsEngagement: number;
  adTargeting: Inference[];
  inferences: Inference[];
  recommendationsGiven: Recommendation[];
  recommendationsReceived: Recommendation[];
  logins: Login[];
  securityChallenges: SecurityChallenge[];
  registration?: { registeredAt?: Date };
  emailAddressCount: number;
  phoneNumberCount: number;

  // file inventory
  detectedFiles: string[];
  missingFiles: string[];
}

export type FileMap = Map<string, string>; // normalized lower path -> raw text content

export interface ParseProgress {
  step: string;
  detail?: string;
  pct?: number;
}
