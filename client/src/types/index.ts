// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'citizen' | 'responder' | 'supervisor' | 'gov_admin'; // supervisor for legacy support
  unit?: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// ─── Incident ─────────────────────────────────────────────────────────────────
export type IncidentType =
  | 'medical'
  | 'flood'
  | 'fire'
  | 'road'
  | 'infrastructure'
  | 'civil'
  | 'other';

export type IncidentStatus =
  | 'open'
  | 'triaging'
  | 'dispatched'
  | 'on_scene'
  | 'resolved'
  | 'closed';

export type IncidentSeverity = 1 | 2 | 3;
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type UpdateType =
  | 'status_change'
  | 'field_update'
  | 'note'
  | 'dispatch'
  | 'notification'
  | 'system';

export interface Incident {
  id: string;
  ticketNumber: string;
  type: IncidentType;
  title: string;
  description: string;
  locationText: string;
  locationLat?: number;
  locationLng?: number;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy: { id: string; email: string; name: string } | null;
  assignedTo: { id: string; email: string; name: string; unit: string } | null;
  aiTriageData: AIResponse | null;
  approvedOption: number | null;
  approvedBy: string | null;
  approvedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentListItem {
  id: string;
  ticketNumber: string;
  type: IncidentType;
  title: string;
  description: string;
  locationText: string;
  locationLat?: number;
  locationLng?: number;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedTo: { id: string; name: string; unit: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  updateType: UpdateType;
  content: string;
  metadata: any;
  createdAt: string;
  author: { name: string; role: string } | null;
}

export interface AIOption {
  rank: number;
  action: string;
  rationale: string;
  resources_required: string[];
  notify: string[];
  eta_minutes: number;
  confidence: number;
}

export interface AIResponse {
  options: AIOption[];
}

// ─── Hospital ─────────────────────────────────────────────────────────────────
export interface Hospital {
  id: string;
  name: string;
  shortName: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  totalBeds: number;
  availableBeds: number;
  icuAvailable: number;
  traumaBays: number;
  lastUpdatedAt: string;
  createdAt: string;
}

// ─── Volunteer ────────────────────────────────────────────────────────────────
export type VolunteerSkill =
  | 'first_aid'
  | 'cpr'
  | 'medical_support'
  | 'vehicle'
  | 'heavy_lifting'
  | 'transport'
  | 'translation'
  | 'psychological_support';

export interface Volunteer {
  id: string;
  userId: string | null;
  fullName: string;
  phone: string;
  skills: VolunteerSkill[];
  postalDistrict?: string;
  isAvailable: boolean;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Volunteer Tasks (community task board) ───────────────────────────────────
export type VolunteerTaskType =
  | 'food_distribution'
  | 'shelter_assistance'
  | 'medical_support'
  | 'logistics'
  | 'translation'
  | 'community_outreach'
  | 'blood_donation'
  | 'technical';

export type TaskUrgency = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus  = 'open' | 'filling' | 'full' | 'completed';

export interface VolunteerTask {
  id: string;
  title: string;
  description: string;
  organization: string;
  orgType: 'government' | 'ngo' | 'healthcare' | 'community';
  taskType: VolunteerTaskType;
  location: string;
  date: string;
  timeSlot: string;
  slotsTotal: number;
  slotsFilled: number;
  skillsRequired: string[];
  urgency: TaskUrgency;
  status: TaskStatus;
  incidentId?: string;
  createdAt: string;
}

// ─── Broadcast ────────────────────────────────────────────────────────────────
export type BroadcastAudience = 'all' | 'responders' | 'zone';

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  audience: BroadcastAudience;
  zone?: string;
  sentBy: { id: string; name: string; role: string };
  incidentId?: string;
  createdAt: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  error: { code: string; message: string; details?: any };
}

// ─── SSE ──────────────────────────────────────────────────────────────────────
export type SSEEventType =
  | 'connected'
  | 'incident_updated'
  | 'timeline_added'
  | 'broadcast_sent';

export interface SSEEvent {
  type: SSEEventType;
  payload?: any;
  connectionId?: string;
}

export interface AITextEvent     { type: 'text';     content: string }
export interface AICompleteEvent { type: 'complete'; options: AIOption[] }
export interface AIErrorEvent    { type: 'error';    error: string }




// ─── Community Organisation ───────────────────────────────────────────────────
export type CommunityOrgType =
  | 'ngo' | 'grassroots' | 'healthcare' | 'government' | 'corporate' | 'religious';

export type CommunityStatus = 'active' | 'standby' | 'deployed' | 'inactive';

export interface CommunityOrganization {
  id: string;
  name: string;
  shortName: string;
  type: CommunityOrgType;
  description: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  skillAreas: string[];
  totalMembers: number;
  availableMembers: number;
  deployedMembers: number;
  activeTasks: number;
  status: CommunityStatus;
  certifications: string[];
  coverageAreas: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}