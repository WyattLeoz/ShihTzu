import { IncidentSeverity, IncidentType, VolunteerSkill } from '../types';

export function formatSeverity(severity: IncidentSeverity): string {
  return severity === 1 ? 'Critical' : severity === 2 ? 'High' : 'Medium';
}

export function formatIncidentType(type: IncidentType): string {
  const types: Record<IncidentType, string> = {
    medical: 'Medical',
    flood: 'Flood',
    fire: 'Fire',
    road: 'Road',
    infrastructure: 'Infrastructure',
    civil: 'Civil',
    other: 'Other',
  };
  return types[type];
}

export function formatSkill(skill: VolunteerSkill): string {
  const skills: Record<VolunteerSkill, string> = {
    first_aid: 'First Aid',
    cpr: 'CPR',
    medical_support: 'Medical Support',
    vehicle: 'Vehicle',
    heavy_lifting: 'Heavy Lifting',
    transport: 'Transport',
    translation: 'Translation',
    psychological_support: 'Psychological Support',
  };
  return skills[skill];
}

export function getSeverityColor(severity: IncidentSeverity): string {
  return severity === 1 ? 'bg-red' : severity === 2 ? 'bg-amber' : 'bg-teal';
}

export function getSeverityBorderColor(severity: IncidentSeverity): string {
  return severity === 1 ? 'border-l-red' : severity === 2 ? 'border-l-amber' : 'border-l-teal';
}