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

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}