export function getTimeAgo(isoString) {
  const now = new Date();
  const past = new Date(isoString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function getSeverityColor(severity) {
  switch (severity) {
    case 3:
      return 'severity-high';
    case 2:
      return 'severity-medium';
    case 1:
    default:
      return 'severity-low';
  }
}

export function getSeverityLabel(severity) {
  switch (severity) {
    case 3:
      return 'HIGH';
    case 2:
      return 'MEDIUM';
    case 1:
    default:
      return 'LOW';
  }
}

export function getIncidentEmoji(type) {
  const emojis = {
    medical: '🚑',
    flood: '🌊',
    fire: '🔥',
    road: '🚧',
    infrastructure: '🏗️',
    civil: '👥'
  };
  return emojis[type] || '⚠️';
}

export function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}