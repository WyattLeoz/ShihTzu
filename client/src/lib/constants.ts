import { IncidentType } from '../types';

export const INCIDENT_TYPES: { value: IncidentType; label: string; emoji: string }[] = [
  { value: 'medical', label: 'Medical', emoji: '🏥' },
  { value: 'flood', label: 'Flood', emoji: '🌊' },
  { value: 'fire', label: 'Fire', emoji: '🔥' },
  { value: 'road', label: 'Road', emoji: '🚗' },
  { value: 'infrastructure', label: 'Infrastructure', emoji: '🏗️' },
  { value: 'civil', label: 'Civil', emoji: '👥' },
  { value: 'other', label: 'Other', emoji: '📋' },
];

export const SEVERITY_LEVELS: { value: number; label: string; color: string }[] = [
  { value: 1, label: '1 Critical', color: 'bg-red' },
  { value: 2, label: '2 High', color: 'bg-amber' },
  { value: 3, label: '3 Medium', color: 'bg-teal' },
];

export const VOLUNTEER_SKILLS: { value: string; label: string }[] = [
  { value: 'first_aid', label: 'First Aid' },
  { value: 'cpr', label: 'CPR' },
  { value: 'medical_support', label: 'Medical Support' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'heavy_lifting', label: 'Heavy Lifting' },
  { value: 'transport', label: 'Transport' },
  { value: 'translation', label: 'Translation' },
  { value: 'psychological_support', label: 'Psychological Support' },
];