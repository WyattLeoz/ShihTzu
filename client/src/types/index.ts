// User types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'citizen' | 'responder' | 'supervisor' | 'gov_admin';
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

// Incident types
export type IncidentType = 'medical' | 'flood' | 'fire' | 'road' | 'infrastructure' | 'civil' | 'other';
export type IncidentStatus = 'open' | 'triaging' | 'dispatched' | 'on_scene' | 'resolved' | 'closed';
export type IncidentSeverity = 1 | 2 | 3;
export type UpdateType = 'status_change' | 'field_update' | 'note' | 'dispatch' | 'notification' | 'system';

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
  reportedBy: {
    id: string;
    email: string;
    name: string;
  } | null;
  assignedTo: {
    id: string;
    email: string;
    name: string;
    unit: string;
  } | null;
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
  author: {
    name: string;
    role: string;
  } | null;
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

// Resource types
export interface Hospital {
  id: string;
  name: string;
  shortName: string;
  address: string;
  lat: number;
  lng: number;
  totalBeds: number;
  availableBeds: number;
  icuAvailable: number;
  traumaBays: number;
  lastUpdatedAt: string;
  createdAt: string;
}

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

export type VolunteerSkill =
  | 'first_aid'
  | 'cpr'
  | 'medical_support'
  | 'vehicle'
  | 'heavy_lifting'
  | 'transport'
  | 'translation'
  | 'psychological_support';

// Broadcast types
export type BroadcastAudience = 'all' | 'responders' | 'zone';

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  audience: BroadcastAudience;
  zone?: string;
  sentBy: {
    id: string;
    name: string;
    role: string;
  };
  incidentId?: string;
  createdAt: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// SSE event types
export type SSEEventType = 'connected' | 'incident_updated' | 'timeline_added' | 'broadcast_sent';

export interface SSEEvent {
  type: SSEEventType;
  payload?: any;
  connectionId?: string;
}

export interface AITextEvent {
  type: 'text';
  content: string;
}

export interface AICompleteEvent {
  type: 'complete';
  options: AIOption[];
}

export interface AIErrorEvent {
  type: 'error';
  error: string;
}