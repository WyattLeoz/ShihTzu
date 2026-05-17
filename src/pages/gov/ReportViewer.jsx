import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, BarChart3, Download, Printer, Clock, MapPin, Users, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import mockIncidents from '../../data/mockIncidents';
import mockHospitals from '../../data/mockHospitals';
import mockVolunteers from '../../data/mockVolunteers';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { callClaude } from '../../lib/claudeApi';
import { formatDateTime } from '../../lib/ticketUtils';

export default function ReportViewer() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const systemPrompt = "You are a Singapore government crisis analyst. Based on this incident data, generate a formal post-incident summary report in markdown with sections: Executive Summary, Incident Timeline, Resources Deployed, Response Effectiveness, Recommendations. Use professional government report language and Singapore-specific context.";

      const incidentData = mockIncidents.map(incident => ({
        id: incident.id,
        type: incident.type,
        title: incident.title,
        location: incident.location,
        severity: incident.severity,
        status: incident.status,
        reportedAt: incident.reportedAt,
        category: incident.category
      }));

      const userMessage = `Generate a comprehensive incident analysis report for the following Singapore emergency incidents data:

${JSON.stringify(incidentData, null, 2)}

Additional context:
- Total incidents: ${mockIncidents.length}
- Active incidents: ${mockIncidents.filter(i => i.status === 'open').length}
- Resolved incidents: ${mockIncidents.filter(i => i.status === 'resolved').length}
- Dispatched incidents: ${mockIncidents.filter(i => i.status === 'dispatched').length}
- Hospital capacity: ${mockHospitals.filter(h => (h.occupiedBeds / h.totalBeds) > 0.8).length} hospitals above 80%
- Available volunteers: ${mockVolunteers.filter(v => v.available).length}

Generate a detailed markdown report.`;

      const response = await callClaude(systemPrompt, userMessage);

      if (response) {
        setReport(response);
      } else {
        // Fallback to a basic report
        setReport(generateFallbackReport());
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
      setReport(generateFallbackReport());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackReport = () => {
    const activeIncidents = mockIncidents.filter(i => i.status === 'open');
    const resolvedIncidents = mockIncidents.filter(i => i.status === 'resolved');
    const dispatchedIncidents = mockIncidents.filter(i => i.status === 'dispatched');

    return `# Incident Analysis Report
**Singapore Crisis Command Platform**
${new Date().toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric' })}

---

## Executive Summary

This report provides a comprehensive analysis of emergency incidents reported through the QuickAid crisis command platform. During the reporting period, **${mockIncidents.length} incidents** were logged across Singapore, with ongoing active incidents requiring immediate attention.

**Key Statistics:**
- **Total Incidents:** ${mockIncidents.length}
- **Active Incidents:** ${activeIncidents.length}
- **Resolved Incidents:** ${resolvedIncidents.length}
- **Dispatched Incidents:** ${dispatchedIncidents.length}
- **Hospital Capacity Alert:** ${mockHospitals.filter(h => (h.occupiedBeds / h.totalBeds) > 0.8).length} hospitals operating above 80% capacity
- **Available Volunteers:** ${mockVolunteers.filter(v => v.available).length}

The overall response effectiveness remains high with a ${Math.round((resolvedIncidents.length / mockIncidents.length) * 100)}% resolution rate. Key areas of concern include medical emergencies in high-density areas and infrastructure-related incidents during peak hours.

---

## Incident Timeline

**Recent Activity Overview:**

The past 24 hours have shown varied incident patterns with peak activity during morning rush hours (7-9 AM) and evening peak hours (5-7 PM).

**Critical Incidents:**
${mockIncidents.filter(i => i.severity === 3).map(incident => `
- **${incident.title}** (${formatDateTime(incident.reportedAt)})
  - Location: ${incident.location}
  - Status: ${incident.status}
  - AI Priority Score: ${(incident.aiScore * 100).toFixed(0)}%
`).join('')}

**Recent Resolutions:**
${mockIncidents.filter(i => i.status === 'resolved').slice(0, 3).map(incident => `
- **${incident.title}** - Resolved
  - Location: ${incident.location}
  - Resolution Time: Approx. 45 minutes
`).join('')}

---

## Resources Deployed

**Emergency Services:**
- Singapore Civil Defence Force (SCDF): Active deployment across multiple incidents
- Singapore Police Force: Supporting traffic management and crowd control
- Land Transport Authority (LTA): Coordinating road closures and diversions

**Hospital Capacity:**
${mockHospitals.map(hospital => {
  const capacity = Math.round((hospital.occupiedBeds / hospital.totalBeds) * 100);
  const status = capacity > 80 ? '🔴 Critical' : capacity > 60 ? '🟡 Moderate' : '🟢 Normal';
  return `
- **${hospital.name}**: ${hospital.occupiedBeds}/${hospital.totalBeds} beds (${capacity}%) - ${status}`;
}).join('')}

**Volunteer Network:**
- Total Registered Volunteers: ${mockVolunteers.length}
- Currently Available: ${mockVolunteers.filter(v => v.available).length}
- Active Response Zones: ${Array.from(new Set(mockVolunteers.map(v => v.location))).length}

**Skill Coverage:**
- First Aid: ${mockVolunteers.filter(v => v.skills.includes('First Aid')).length} volunteers
- Search & Rescue: ${mockVolunteers.filter(v => v.skills.includes('Search & Rescue')).length} volunteers
- Mental Health: ${mockVolunteers.filter(v => v.skills.includes('Mental Health')).length} volunteers
- Logistics: ${mockVolunteers.filter(v => v.skills.includes('Logistics')).length} volunteers
- Translation: ${mockVolunteers.filter(v => v.skills.includes('Translation')).length} volunteers
- Tech Support: ${mockVolunteers.filter(v => v.skills.includes('Tech Support')).length} volunteers

---

## Response Effectiveness

**Performance Metrics:**

1. **Average Response Time:** 8.5 minutes
   - Target: <10 minutes ✅
   - Trend: Improving (+12% faster than previous period)

2. **First Responder Deployment:** 12.3 minutes average
   - Target: <15 minutes ✅
   - Coverage: 95% of incidents

3. **Resolution Rate:** ${Math.round((resolvedIncidents.length / mockIncidents.length) * 100)}%
   - Target: >85% ✅
   - Average resolution time: 45.2 minutes

**Incident Type Breakdown:**
- Medical Emergencies: ${mockIncidents.filter(i => i.type === 'medical').length} (highest priority)
- Fire-related: ${mockIncidents.filter(i => i.type === 'fire').length}
- Flood incidents: ${mockIncidents.filter(i => i.type === 'flood').length}
- Road/Infrastructure: ${mockIncidents.filter(i => ['road', 'infrastructure'].includes(i.type)).length}
- Civil incidents: ${mockIncidents.filter(i => i.type === 'civil').length}

**Severity Distribution:**
- High Severity: ${mockIncidents.filter(i => i.severity === 3).length} incidents
- Medium Severity: ${mockIncidents.filter(i => i.severity === 2).length} incidents
- Low Severity: ${mockIncidents.filter(i => i.severity === 1).length} incidents

---

## Recommendations

### Immediate Actions

1. **Hospital Capacity Management**
   - SGH is operating at 81% capacity. Recommend diverting non-critical cases to KTPH or Alexandra Hospital.
   - Activate additional emergency beds at TTSH for overflow management.

2. **Resource Allocation**
   - Increase medical response units in Tampines and Jurong regions where incident frequency is higher.
   - Deploy additional volunteers with First Aid certification to high-risk zones.

### Short-term Improvements (1-2 weeks)

1. **Infrastructure Resilience**
   - Coordinate with LTA and PUB to address recurring flood-prone areas.
   - Implement early warning systems for flash floods in western Singapore.

2. **Volunteer Network Enhancement**
   - Conduct training sessions for 50 new volunteers in Jurong and Woodlands areas.
   - Improve volunteer coverage during peak hours (7-9 AM, 5-7 PM).

3. **Communication Protocols**
   - Enhance public notification system for severe weather alerts.
   - Improve responder-to-responder communication channels.

### Long-term Strategic Planning (1-3 months)

1. **AI-Powered Predictive Analytics**
   - Implement machine learning models for incident prediction based on historical data.
   - Develop real-time risk assessment tools for emergency responders.

2. **Community Engagement**
   - Launch public education campaigns on emergency preparedness.
   - Establish community emergency response teams in residential areas.

3. **Infrastructure Investment**
   - Review and upgrade drainage systems in flood-prone regions.
   - Implement smart city sensors for early incident detection.

---

## Conclusion

The QuickAid crisis command platform continues to demonstrate strong performance in emergency response coordination. While the current incident volume is manageable, proactive measures are recommended to address capacity constraints and improve response efficiency in high-risk areas.

**Overall Assessment:** The emergency response system is operating effectively with room for optimization in resource allocation and predictive capabilities.

---

*Report generated by QuickAid AI Analyst*
*For internal use only - Singapore Crisis Command Platform*`;
  };

  const handlePrint = () => {
    window.print();
  };

  const renderMarkdown = (markdown) => {
    if (!markdown) return '';

    // Simple markdown parser
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-text-primary mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-text-primary mt-8 mb-3 pb-2 border-b border-border">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-text-primary mt-4 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Lists
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1 text-text-primary">$1</li>')
      .replace(/(<li.*<\/li>)/g, '<ul class="list-disc mb-3">$1</ul>')
      // Line breaks
      .replace(/\n\n/g, '<p class="mb-4 text-text-primary leading-relaxed"></p>')
      // Remove empty paragraphs
      .replace(/<p class="mb-4 text-text-primary leading-relaxed"><\/p>/g, '')
      // Horizontal rules
      .replace(/^---$/gim, '<hr class="my-6 border-border" />');

    return html;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation bar */}
      <nav className="bg-[#042C53] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-4">
          <Shield className="w-6 h-6" />
          <h1 className="font-semibold text-lg">QuickAid Command</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={generateReport} disabled={loading}>
            Regenerate
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </nav>

      {/* Main content */}
      <div className="p-6 max-w-5xl mx-auto">
        {/* Report header */}
        <div className="mb-6 print:hidden">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">Incident Report</h1>
              <p className="text-text-muted text-sm">
                Comprehensive analysis of emergency incidents in Singapore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge status="open">Draft</Badge>
            <span className="text-text-muted text-sm">
              Generated {new Date().toLocaleString('en-SG')}
            </span>
          </div>
        </div>

        {/* Report content */}
        <Card className="print:shadow-none print:border-none">
          <CardContent className="p-8 print:p-0">
            {loading ? (
              <LoadingSpinner message="Generating incident analysis report..." />
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-[#E24B4A] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Error generating report</h3>
                <p className="text-text-muted mb-4">{error}</p>
                <Button onClick={generateReport}>Try again</Button>
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 print:hidden">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-text-primary">{mockIncidents.length}</p>
              <p className="text-xs text-text-muted">Total incidents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-[#EF9F27] mx-auto mb-2" />
              <p className="text-2xl font-bold text-text-primary">8.5m</p>
              <p className="text-xs text-text-muted">Avg response</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-text-primary">87%</p>
              <p className="text-xs text-text-muted">Resolution rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-[#042C53] mx-auto mb-2" />
              <p className="text-2xl font-bold text-text-primary">+12%</p>
              <p className="text-xs text-text-muted">Efficiency gain</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}