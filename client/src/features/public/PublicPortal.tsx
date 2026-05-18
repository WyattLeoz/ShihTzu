import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIncidents, useCreateIncident } from '../../api/incidents';
import { useHospitals, useVolunteerTasks, useSignUpForTask } from '../../api/resources';
import { useBroadcasts } from '../../api/broadcasts';
import { StatusBadge } from '../../components/StatusBadge';
import { formatIncidentType, formatSeverity, getSeverityBorderColor } from '../../lib/formatters';
import {
  IncidentListItem, Hospital, Broadcast,
  IncidentType, VolunteerTask,
} from '../../types';
import {
  MapPin, Clock, Activity, AlertTriangle,
  Plus, Send, X, Navigation, UserPlus, CheckCircle,
  Megaphone, Heart, Users, Building2,
  Shield, Info, Phone, ChevronDown, ChevronUp,
  BookOpen, Flame, Droplets, Car, Wrench, Flag,
  HelpCircle, ExternalLink, ArrowRight, Calendar,
  User, AlertCircle, FileText,
} from 'lucide-react';
import { VolunteerRegistration } from './VolunteerRegistration';

// ─── Advisory content per broadcast type ──────────────────────────────────────

interface AdvisoryStep  { heading: string; body: string }
interface AdvisoryContact { label: string; number: string }
interface AdvisoryResource { label: string; url: string }

interface AdvisoryContent {
  icon: string;
  colorCls: string;
  borderCls: string;
  bgCls: string;
  title: string;
  severity: 'critical' | 'high' | 'moderate' | 'info';
  summary: string;
  steps: AdvisoryStep[];
  doNot: string[];
  contacts: AdvisoryContact[];
  resources: AdvisoryResource[];
}

const ADVISORY_CONTENT: Record<string, AdvisoryContent> = {
  flood: {
    icon: '🌊',
    colorCls: 'text-blue-700',
    borderCls: 'border-blue-400',
    bgCls: 'bg-blue-50',
    severity: 'critical',
    title: 'Flash Flood — What You Should Do',
    summary:
      'Flash floods can rise rapidly and be life-threatening. Act immediately and follow all official instructions.',
    steps: [
      {
        heading: 'Move to higher ground immediately',
        body: 'If you are in a low-lying area, move to a higher floor or higher terrain right now. Do not wait for water to enter your home.',
      },
      {
        heading: 'Do NOT enter floodwater',
        body: 'Just 15 cm of moving water can knock an adult off their feet. 30 cm can sweep a vehicle away. Stay out of floodwater.',
      },
      {
        heading: 'Avoid underpasses, canals and low-lying roads',
        body: 'Underpasses can fill within seconds. Do not attempt to drive or walk through submerged roads.',
      },
      {
        heading: 'Switch off electricity at the mains',
        body: 'If water is entering your home, turn off the electrical mains switch immediately to prevent electrocution risk.',
      },
      {
        heading: 'Move valuables and medications to higher shelves',
        body: 'If you have time and it is safe, move important documents, medications, and electronics to a higher level.',
      },
      {
        heading: 'Call 995 if trapped or in danger',
        body: 'If you are trapped or someone is in immediate danger, call SCDF at 995. Stay on the line and follow operator instructions.',
      },
      {
        heading: 'Follow official evacuation orders immediately',
        body: 'If authorities order evacuation, leave at once. Bring your IC, phone, charger, and medications. Do not delay.',
      },
    ],
    doNot: [
      'Do NOT drive through flooded roads — your vehicle can be swept away in seconds',
      'Do NOT touch electrical equipment in wet or flooded areas',
      'Do NOT use lifts in a building that is flooding',
      'Do NOT ignore or delay complying with official evacuation orders',
      'Do NOT enter storm drains, canals or waterways',
      'Do NOT spread unverified information on social media',
    ],
    contacts: [
      { label: 'SCDF Emergency (trapped / injured)', number: '995' },
      { label: 'PUB 24-hour Drainage Ops Hotline', number: '1800 284 6600' },
      { label: 'SCDF Non-Emergency Line', number: '1777' },
    ],
    resources: [
      { label: 'PUB MyWaters — Live Flood Map', url: 'https://www.pub.gov.sg' },
      { label: 'SCDF — Flood Safety Tips', url: 'https://www.scdf.gov.sg' },
      { label: 'Gov.sg — Official Updates', url: 'https://www.gov.sg' },
    ],
  },

  haze: {
    icon: '💨',
    colorCls: 'text-gray-700',
    borderCls: 'border-gray-400',
    bgCls: 'bg-gray-50',
    severity: 'moderate',
    title: 'Haze Advisory — Protect Your Health',
    summary:
      'Haze particles are hazardous to health. Reduce exposure by staying indoors and wearing proper masks.',
    steps: [
      {
        heading: 'Check the PSI reading before going outdoors',
        body: 'Use the myENV app or NEA website for live 3-hour PSI readings. Adjust your plans accordingly.',
      },
      {
        heading: 'Stay indoors with windows and doors closed',
        body: 'Keep indoor air cleaner by closing windows. Use air-conditioning or air purifiers with HEPA filters if available.',
      },
      {
        heading: 'Wear an N95 (FFP2) mask outdoors',
        body: 'Surgical masks and cloth masks do NOT protect against haze particles. Only a properly fitted N95 mask provides adequate protection.',
      },
      {
        heading: 'Reduce or stop strenuous outdoor activity',
        body: 'When PSI exceeds 100 (Unhealthy), avoid outdoor exercise. At PSI 201+ (Very Unhealthy), stay indoors as much as possible.',
      },
      {
        heading: 'Vulnerable groups stay indoors completely',
        body: 'Children, the elderly, pregnant women, and those with heart or lung conditions should not go outdoors when PSI is Unhealthy or above.',
      },
      {
        heading: 'Stay hydrated',
        body: 'Drink adequate water. Haze causes respiratory irritation and your body needs hydration to cope.',
      },
      {
        heading: 'See a doctor if symptomatic',
        body: 'If you experience difficulty breathing, chest tightness, wheezing, or prolonged coughing, consult a doctor promptly.',
      },
    ],
    doNot: [
      'Do NOT exercise or do strenuous activity outdoors when PSI is Unhealthy or above',
      'Do NOT rely on surgical masks or cloth masks — they provide no protection against haze',
      'Do NOT burn waste, hold open-air burning or BBQ events during haze',
      'Do NOT leave children, elderly or pets outdoors',
    ],
    contacts: [
      { label: 'Ambulance (severe breathing difficulty)', number: '995' },
      { label: 'NEA Environment Hotline', number: '1800 2255 632' },
      { label: 'MOH Healthline', number: '1800 333 9999' },
    ],
    resources: [
      { label: 'NEA — Live PSI & Air Quality', url: 'https://www.nea.gov.sg' },
      { label: 'MOH — Haze Health Advisory', url: 'https://www.moh.gov.sg' },
      { label: 'HealthHub — N95 Mask Fitting Guide', url: 'https://www.healthhub.sg' },
    ],
  },

  dengue: {
    icon: '🦟',
    colorCls: 'text-orange-700',
    borderCls: 'border-orange-400',
    bgCls: 'bg-orange-50',
    severity: 'moderate',
    title: 'Dengue Cluster Alert — Protect Yourself',
    summary:
      'A dengue cluster has been identified in your area. Mosquitoes breed in stagnant water. Take action now.',
    steps: [
      {
        heading: 'Eliminate stagnant water in your home every week',
        body: 'Check and change water in flower pot plates, vases, pails, buckets, and pet water bowls at least once a week. This is the most effective prevention.',
      },
      {
        heading: 'Spray insecticide in dark, damp areas',
        body: 'Spray insecticide in corners, under furniture, and inside wardrobes where mosquitoes rest.',
      },
      {
        heading: 'Apply insect repellent when outdoors',
        body: 'Use repellents containing DEET, Picaridin or IR3535. Reapply every 4 hours. Aedes mosquitoes are most active during dawn and dusk.',
      },
      {
        heading: 'Wear long-sleeved clothing',
        body: 'When in the affected area, wear long-sleeved shirts and long trousers to reduce exposed skin.',
      },
      {
        heading: 'Use mosquito nets when sleeping',
        body: 'Use bed nets, especially for young children and the elderly.',
      },
      {
        heading: 'Know the symptoms — seek help early',
        body: 'Dengue symptoms: sudden high fever (39–40°C), severe headache, pain behind the eyes, joint/muscle pain, rash. See a doctor IMMEDIATELY — early treatment is critical.',
      },
    ],
    doNot: [
      'Do NOT take aspirin or ibuprofen if you suspect dengue — these increase bleeding risk',
      'Do NOT self-medicate or delay seeing a doctor',
      'Do NOT ignore symptoms of dengue — it can progress to severe dengue rapidly',
      'Do NOT leave any container that can collect water uncovered',
    ],
    contacts: [
      { label: 'Ambulance (severe symptoms)', number: '995' },
      { label: 'NEA Dengue Enquiries', number: '1800 2255 632' },
      { label: 'MOH Healthline', number: '1800 333 9999' },
    ],
    resources: [
      { label: 'NEA — Dengue Cluster Map', url: 'https://www.nea.gov.sg' },
      { label: 'MOH — Dengue Information', url: 'https://www.moh.gov.sg' },
    ],
  },

  health: {
    icon: '🏥',
    colorCls: 'text-red-700',
    borderCls: 'border-red-400',
    bgCls: 'bg-red-50',
    severity: 'high',
    title: 'Health Advisory — Protect Yourself and Others',
    summary:
      'A health advisory has been issued. Follow MOH guidance to protect yourself and prevent spread.',
    steps: [
      {
        heading: 'Practise good personal hygiene',
        body: 'Wash hands frequently with soap and water for at least 20 seconds, especially before eating and after using the toilet.',
      },
      {
        heading: 'Stay home if you are unwell',
        body: 'If you have fever, cough, runny nose, or feel unwell, stay home. Do not go to work, school, or public places.',
      },
      {
        heading: 'Wear a mask if you are symptomatic',
        body: 'Wear a surgical mask to protect others around you if you must go out while unwell.',
      },
      {
        heading: 'See a doctor early — do not delay',
        body: 'Consult your GP or family doctor early. Do not wait until symptoms worsen. Early treatment leads to better outcomes.',
      },
      {
        heading: 'Follow MOH and official advisories',
        body: 'Monitor MOH, CNA, and gov.sg WhatsApp channel for specific guidance on the current health situation.',
      },
    ],
    doNot: [
      'Do NOT self-medicate without medical advice',
      'Do NOT go to A&E unless you have a life-threatening emergency — call your GP first',
      'Do NOT spread unverified health information online — only share MOH-confirmed information',
      'Do NOT ignore symptoms that worsen or do not improve',
    ],
    contacts: [
      { label: 'Ambulance (life-threatening emergency)', number: '995' },
      { label: 'MOH Healthline', number: '1800 333 9999' },
      { label: 'NCID Hotline', number: '6389 9999' },
    ],
    resources: [
      { label: 'MOH — Latest Health Advisories', url: 'https://www.moh.gov.sg' },
      { label: 'HealthHub — Find a GP Near You', url: 'https://www.healthhub.sg' },
      { label: 'Gov.sg WhatsApp Updates', url: 'https://www.gov.sg' },
    ],
  },

  weather: {
    icon: '⛈️',
    colorCls: 'text-indigo-700',
    borderCls: 'border-indigo-400',
    bgCls: 'bg-indigo-50',
    severity: 'high',
    title: 'Severe Weather Advisory',
    summary:
      'Severe thunderstorms with heavy rain and lightning are expected. Take shelter immediately.',
    steps: [
      {
        heading: 'Seek shelter in a substantial building immediately',
        body: 'Move indoors into a building. Avoid bus stops, pavilions, and open shelters — they do not protect against lightning.',
      },
      {
        heading: 'Stay away from trees, poles and tall structures',
        body: 'Trees and tall structures attract lightning strikes. Keep well clear of them during a thunderstorm.',
      },
      {
        heading: 'Secure loose items outdoors',
        body: 'Bring in or secure potted plants, outdoor furniture, and any objects that can be blown away by strong winds.',
      },
      {
        heading: 'Unplug electronics if not in use',
        body: 'Disconnect televisions, computers, and other electronics from power sockets to protect against power surges from lightning.',
      },
      {
        heading: 'Exit any outdoor swimming pool or open water',
        body: 'If swimming outdoors, get out of the water immediately and take shelter indoors.',
      },
      {
        heading: 'Avoid windows and doors during heavy storms',
        body: 'Stay away from windows during strong winds and heavy rain. Falling glass or debris can cause injury.',
      },
    ],
    doNot: [
      'Do NOT shelter under trees, flagpoles or electrical pylons during lightning',
      'Do NOT use mobile phones or wired devices outdoors during a thunderstorm',
      'Do NOT swim, sail or take part in water sports during a storm warning',
      'Do NOT drive through flooded roads caused by heavy rain',
    ],
    contacts: [
      { label: 'SCDF Emergency (injury / trapped)', number: '995' },
      { label: 'Meteorological Service Singapore', number: '6542 7788' },
    ],
    resources: [
      { label: 'MSS — Weather Forecast & Warnings', url: 'https://www.weather.gov.sg' },
      { label: 'NEA — Weather Advisories', url: 'https://www.nea.gov.sg' },
    ],
  },

  fire: {
    icon: '🔥',
    colorCls: 'text-orange-700',
    borderCls: 'border-orange-500',
    bgCls: 'bg-orange-50',
    severity: 'critical',
    title: 'Fire Advisory — Act Immediately',
    summary:
      'If a fire is nearby, evacuate immediately. Do not attempt to fight a spreading fire yourself.',
    steps: [
      {
        heading: 'Evacuate immediately using the staircase',
        body: 'Leave the building at once. Use the nearest fire escape staircase. Close all doors behind you as you leave — this slows the spread of fire and smoke.',
      },
      {
        heading: 'Alert others as you leave',
        body: 'Shout "Fire!" and activate the fire alarm call point as you evacuate so others can respond.',
      },
      {
        heading: 'Call SCDF at 995 once safely outside',
        body: 'Do not call from inside the building. Once safely out, dial 995 and give your exact location and describe the fire.',
      },
      {
        heading: 'Assemble at the muster point',
        body: 'Proceed to the building\'s designated muster point and wait for the all-clear from SCDF. Do not re-enter for any reason.',
      },
      {
        heading: 'If trapped, signal and stay low',
        body: 'Close the door, seal gaps with cloth to reduce smoke, signal from a window and call 995. Stay low to the ground where air is cleaner.',
      },
    ],
    doNot: [
      'Do NOT use lifts — they may stop at the fire floor or lose power',
      'Do NOT attempt to fight a large or spreading fire yourself',
      'Do NOT stop to collect belongings — get out immediately',
      'Do NOT open a door that feels hot — fire may be on the other side',
      'Do NOT re-enter the building until SCDF gives the all-clear',
    ],
    contacts: [
      { label: 'SCDF Fire Emergency', number: '995' },
      { label: 'SCDF Non-Emergency', number: '1777' },
    ],
    resources: [
      { label: 'SCDF — Fire Safety Guide', url: 'https://www.scdf.gov.sg' },
    ],
  },

  evacuation: {
    icon: '🚨',
    colorCls: 'text-red-700',
    borderCls: 'border-red-500',
    bgCls: 'bg-red-50',
    severity: 'critical',
    title: 'Evacuation Order — Leave Now',
    summary:
      'An official evacuation order has been issued. Leave immediately. Your safety is the absolute priority.',
    steps: [
      {
        heading: 'Leave immediately — do not delay',
        body: 'Stop what you are doing and leave now. Every minute matters. Do not wait for the situation to worsen before evacuating.',
      },
      {
        heading: 'Bring only essential items',
        body: 'Take your IC/passport, medications, phone, charger, and a small amount of cash. Leave heavy items and non-essentials behind.',
      },
      {
        heading: 'Proceed to the designated evacuation centre',
        body: 'Follow signage and instructions from SCDF, SPF, and PA to reach the nearest evacuation centre. Do not drive against the flow of evacuees.',
      },
      {
        heading: 'Alert and assist neighbours who need help',
        body: 'Knock on the doors of elderly, disabled, or unaware neighbours and assist them if you can do so safely.',
      },
      {
        heading: 'Register at the evacuation centre',
        body: 'Register yourself and all family members upon arrival so authorities can account for all residents.',
      },
      {
        heading: 'Stay at the centre and wait for official updates',
        body: 'Do not leave the evacuation centre until authorities declare it safe to return home.',
      },
    ],
    doNot: [
      'Do NOT return home until authorities issue the all-clear',
      'Do NOT use vehicles unless authorities specifically direct you to drive',
      'Do NOT stop to take photos or share unverified updates on social media',
      'Do NOT refuse to evacuate — official orders are issued to protect your life',
    ],
    contacts: [
      { label: 'SCDF Emergency', number: '995' },
      { label: 'Police Emergency', number: '999' },
      { label: 'PA Community Hotline', number: '6225 5322' },
    ],
    resources: [
      { label: 'Gov.sg — Official Evacuation Updates', url: 'https://www.gov.sg' },
      { label: 'SCDF — Civil Defence Preparedness', url: 'https://www.scdf.gov.sg' },
    ],
  },

  general: {
    icon: '📢',
    colorCls: 'text-navy',
    borderCls: 'border-navy-border',
    bgCls: 'bg-navy-light',
    severity: 'info',
    title: 'Official Advisory — Key Information',
    summary:
      'An official advisory has been issued. Read carefully, follow all instructions, and stay informed.',
    steps: [
      {
        heading: 'Read the full advisory carefully',
        body: 'Take note of all instructions and guidance from the issuing authority. Understand what is expected of you.',
      },
      {
        heading: 'Follow all official instructions',
        body: 'Comply promptly with all guidance from government agencies. Official advisories are issued to protect public safety.',
      },
      {
        heading: 'Stay informed via official channels',
        body: 'Monitor Gov.sg, CNA, 938Live, and your local RC/CC for the latest updates on the situation.',
      },
      {
        heading: 'Share the official advisory with family and friends',
        body: 'Help spread accurate information to those around you, especially elderly or vulnerable residents who may not have seen the advisory.',
      },
    ],
    doNot: [
      'Do NOT spread unverified information — only share official sources',
      'Do NOT ignore the advisory or assume it does not apply to you',
      'Do NOT put yourself or others at unnecessary risk',
    ],
    contacts: [
      { label: 'Emergency (fire / medical)', number: '995' },
      { label: 'Police Emergency', number: '999' },
      { label: 'SCDF Non-Emergency', number: '1777' },
    ],
    resources: [
      { label: 'Gov.sg — Official Updates', url: 'https://www.gov.sg' },
      { label: 'CNA — Live News Coverage', url: 'https://www.channelnewsasia.com' },
    ],
  },
};

function inferAdvisoryType(broadcast: Broadcast): string {
  const text = `${broadcast.title} ${broadcast.message}`.toLowerCase();
  if (text.includes('evacuat'))                                                 return 'evacuation';
  if (text.includes('flood') || text.includes('water level') || text.includes('drain')) return 'flood';
  if (text.includes('haze') || text.includes('psi') || text.includes('air quality')) return 'haze';
  if (text.includes('dengue') || text.includes('mosquito') || text.includes('aedes')) return 'dengue';
  if (text.includes('fire') || text.includes('blaze') || text.includes('burn'))  return 'fire';
  if (text.includes('storm') || text.includes('thunder') || text.includes('lightning') || text.includes('rain')) return 'weather';
  if (text.includes('health') || text.includes('outbreak') || text.includes('disease') || text.includes('virus') || text.includes('covid')) return 'health';
  return 'general';
}

// ─── Broadcast Detail Modal ────────────────────────────────────────────────────

function BroadcastDetailModal({
  broadcast,
  onClose,
}: {
  broadcast: Broadcast;
  onClose: () => void;
}) {
  const advisoryType = inferAdvisoryType(broadcast);
  const advisory     = ADVISORY_CONTENT[advisoryType] || ADVISORY_CONTENT.general;

  const severityBadge: Record<string, { label: string; cls: string }> = {
    critical: { label: 'CRITICAL ALERT',  cls: 'bg-red text-white' },
    high:     { label: 'HIGH PRIORITY',   cls: 'bg-orange-600 text-white' },
    moderate: { label: 'ADVISORY',        cls: 'bg-amber text-white' },
    info:     { label: 'NOTICE',          cls: 'bg-navy text-white' },
  };
  const badge = severityBadge[advisory.severity];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">

        {/* ── Government header ── */}
        <div className="bg-navy rounded-t-xl px-4 py-4 sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded tracking-wider ${badge.cls}`}>
                  {badge.label}
                </span>
                <span className="text-[10px] text-white/60 font-mono">{broadcast.audience.toUpperCase()}</span>
              </div>
              <h2 className="text-white font-bold text-base leading-tight">{broadcast.title}</h2>
              <p className="text-white/60 text-xs mt-1">
                Issued by <span className="font-semibold text-white/80">{broadcast.sentBy.name}</span>
                {' · '}
                {new Date(broadcast.createdAt).toLocaleString('en-SG', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white mt-0.5 flex-shrink-0">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5">

          {/* ── Official message ── */}
          <div className={`rounded-sm border-l-4 ${advisory.borderCls} ${advisory.bgCls} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{advisory.icon}</span>
              <div>
                <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider">
                  Official Government Advisory
                </p>
                <p className={`text-sm font-bold ${advisory.colorCls}`}>{advisory.title}</p>
              </div>
            </div>
            <p className="text-sm text-ink leading-relaxed">{broadcast.message}</p>
          </div>

          {/* ── Advisory summary ── */}
          <div className="bg-paper border border-paper-border rounded-sm px-4 py-3">
            <p className="text-xs text-ink-muted leading-relaxed">{advisory.summary}</p>
          </div>

          {/* ── What to do ── */}
          <section>
            <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle size={13} className="text-teal" /> What You Should Do
            </h3>
            <div className="space-y-3">
              {advisory.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold
                    flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{step.heading}</p>
                    <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Do NOT ── */}
          <section>
            <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <X size={13} className="text-red" /> Do NOT Do These
            </h3>
            <div className="bg-red-light border border-red rounded-sm p-3 space-y-2">
              {advisory.doNot.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-dark">
                  <span className="font-black flex-shrink-0 mt-0.5 text-red">✕</span>
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Emergency contacts ── */}
          <section>
            <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <Phone size={13} /> Emergency Contacts
            </h3>
            <div className="space-y-2">
              {advisory.contacts.map(c => (
                <a
                  key={c.number}
                  href={`tel:${c.number.replace(/\s/g, '')}`}
                  className="flex items-center justify-between bg-navy text-white
                    rounded-sm px-4 py-3 hover:bg-navy-mid transition-colors active:bg-navy-mid"
                >
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="opacity-70" />
                    <span className="text-sm font-medium">{c.label}</span>
                  </div>
                  <span className="font-mono font-black text-teal text-lg tracking-wider">
                    {c.number}
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* ── Official resources ── */}
          {advisory.resources.length > 0 && (
            <section>
              <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <ExternalLink size={13} /> Official Resources
              </h3>
              <div className="space-y-2">
                {advisory.resources.map(r => (
                  <a key={r.url} href={r.url} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between bg-white border border-paper-border
                      rounded-sm px-3 py-2.5 hover:bg-paper-hover text-sm text-ink font-medium">
                    {r.label}
                    <ExternalLink size={13} className="text-teal flex-shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* ── PDPA disclaimer ── */}
          <div className="bg-paper-hover border border-paper-border rounded-sm px-3 py-2.5">
            <p className="text-[11px] text-ink-muted leading-relaxed">
              This advisory is issued by the Singapore Government. Information is accurate as of the
              time of publication. Follow updates on{' '}
              <a href="https://www.gov.sg" target="_blank" rel="noreferrer" className="text-teal underline">gov.sg</a>
              {' '}and official agency websites.
            </p>
          </div>

          <button onClick={onClose}
            className="w-full py-2.5 bg-paper border border-paper-border rounded-sm
              text-sm font-medium text-ink-muted hover:bg-paper-hover transition-colors">
            Close Advisory
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Alert Guide Data (for clicking on incidents) ──────────────────────────────

const ALERT_GUIDES: Record<string, {
  title: string;
  icon: React.ReactNode;
  color: string;
  steps: { heading: string; body: string }[];
  doNot: string[];
  contacts: { label: string; number: string }[];
}> = {
  fire: {
    title: 'Fire',
    icon: <Flame size={20} />,
    color: 'text-orange-600',
    steps: [
      { heading: 'Evacuate immediately', body: 'Leave the building at once. Do not use lifts. Use the nearest fire escape staircase.' },
      { heading: 'Alert others', body: 'Shout "Fire!" and activate the nearest fire alarm call point as you leave.' },
      { heading: 'Call 995', body: 'Once safely outside, call SCDF at 995. Give your location and describe the fire.' },
      { heading: 'Assemble at muster point', body: 'Proceed to the designated assembly area and wait for SCDF. Do not re-enter.' },
    ],
    doNot: ['Do not use lifts', 'Do not attempt to fight large fires', 'Do not collect belongings before evacuating', 'Do not re-enter the building'],
    contacts: [{ label: 'SCDF (Fire & Rescue)', number: '995' }],
  },
  flood: {
    title: 'Flood',
    icon: <Droplets size={20} />,
    color: 'text-blue-600',
    steps: [
      { heading: 'Move to higher ground', body: 'Immediately relocate to upper floors or higher terrain. Avoid basements and underpasses.' },
      { heading: 'Avoid floodwater', body: 'Never walk or drive through floodwater — even 15 cm can knock you off your feet.' },
      { heading: 'Turn off utilities', body: 'Switch off electricity at the mains if water is entering your home.' },
      { heading: 'Stay informed', body: 'Monitor PUB MyWaters app and 938Live radio for evacuation orders.' },
    ],
    doNot: ['Do not drive through flooded roads', 'Do not touch electrical equipment in wet areas', 'Do not enter drains, canals or rivers', 'Do not ignore official evacuation orders'],
    contacts: [{ label: 'SCDF Non-Emergency', number: '1777' }, { label: 'PUB 24hr', number: '1800 284 6600' }],
  },
  medical: {
    title: 'Medical Emergency',
    icon: <Heart size={20} />,
    color: 'text-red-600',
    steps: [
      { heading: 'Call 995 immediately', body: 'Describe the patient\'s condition, age, and exact location. Stay on the line.' },
      { heading: 'Keep the person still', body: 'Do not move the patient unless they are in immediate danger. Keep them calm and warm.' },
      { heading: 'Perform CPR if needed', body: 'If unresponsive and not breathing normally, begin chest compressions at 100–120 per minute.' },
      { heading: 'Use an AED if available', body: 'AEDs are found at MRT stations, community centres, and major buildings. Follow voice instructions.' },
    ],
    doNot: ['Do not give food or water', 'Do not remove embedded objects', 'Do not leave the patient alone', 'Do not delay calling 995'],
    contacts: [{ label: 'Ambulance (SCDF)', number: '995' }],
  },
  road: {
    title: 'Road Accident',
    icon: <Car size={20} />,
    color: 'text-yellow-600',
    steps: [
      { heading: 'Ensure safety first', body: 'Turn on hazard lights, move to the road shoulder if possible, and set up warning triangles.' },
      { heading: 'Call 995 or 999', body: 'Call 995 if anyone is injured. Call 999 if the accident involves crime or hit-and-run.' },
      { heading: 'Do not move injured persons', body: 'Unless they are in danger of fire or further collision, keep injured people still.' },
      { heading: 'Exchange details', body: 'Collect name, NRIC, vehicle number, and insurer of all parties involved.' },
    ],
    doNot: ['Do not obstruct traffic unnecessarily', 'Do not move severely injured persons', 'Do not admit liability at the scene', 'Do not leave the scene without exchanging information'],
    contacts: [{ label: 'Police', number: '999' }, { label: 'Ambulance', number: '995' }],
  },
  infrastructure: {
    title: 'Infrastructure Failure',
    icon: <Wrench size={20} />,
    color: 'text-purple-600',
    steps: [
      { heading: 'Keep a safe distance', body: 'Move away from collapsed structures, downed power lines, or gas leaks immediately.' },
      { heading: 'Do not touch power lines', body: 'Treat all fallen cables as live. Keep at least 10 metres away and warn others.' },
      { heading: 'Report to authorities', body: 'Call SCDF (1777) for non-life-threatening issues or 995 for emergencies involving injuries.' },
      { heading: 'Evacuate if gas is suspected', body: 'If you smell gas, evacuate and do not operate electrical switches. Call SP Group at 1800 752 1234.' },
    ],
    doNot: ['Do not touch fallen power lines', 'Do not enter damaged structures', 'Do not use open flames near gas leaks', 'Do not operate electrical switches if gas is suspected'],
    contacts: [{ label: 'SCDF Non-Emergency', number: '1777' }, { label: 'SP Group (Gas/Power)', number: '1800 752 1234' }],
  },
  civil: {
    title: 'Civil Disturbance',
    icon: <Flag size={20} />,
    color: 'text-navy',
    steps: [
      { heading: 'Leave the area immediately', body: 'Do not stay to watch. Move quickly and calmly away from the disturbance.' },
      { heading: 'Call 999', body: 'Report to the police with your location, number of people involved, and any weapons observed.' },
      { heading: 'Shelter in place if unable to leave', body: 'Lock doors, stay away from windows, and wait for police clearance.' },
      { heading: 'Follow police instructions', body: 'Comply with all police directives immediately and do not argue with officers on scene.' },
    ],
    doNot: ['Do not attempt to intervene', 'Do not film confrontations at close range', 'Do not spread unverified information', 'Do not return until police declare the area safe'],
    contacts: [{ label: 'Police', number: '999' }],
  },
  other: {
    title: 'General Emergency',
    icon: <HelpCircle size={20} />,
    color: 'text-ink-muted',
    steps: [
      { heading: 'Assess the situation', body: 'Determine if there is immediate risk to life. Prioritise your own safety first.' },
      { heading: 'Call the right number', body: 'Fire/medical: 995. Police: 999. Non-emergency SCDF: 1777.' },
      { heading: 'Provide clear information', body: 'State your location, what happened, how many people are affected, and any injuries.' },
      { heading: 'Follow operator instructions', body: 'Stay on the line and comply with all guidance given by the emergency operator.' },
    ],
    doNot: ['Do not hang up until told to', 'Do not put yourself in danger', 'Do not spread unverified information online'],
    contacts: [{ label: 'SCDF (Fire/Medical)', number: '995' }, { label: 'Police', number: '999' }],
  },
};

// ─── Community Activities mock data ───────────────────────────────────────────

export interface CommunityActivity {
  id: string;
  title: string;
  organizer: string;
  organizerType: 'grassroots' | 'ngo' | 'government' | 'religious' | 'corporate';
  category: 'preparedness' | 'relief' | 'recovery' | 'awareness' | 'training';
  description: string;
  location: string;
  date: string;
  time: string;
  maxParticipants: number;
  registered: number;
  tags: string[];
  contactEmail?: string;
  contactPhone?: string;
}

const MOCK_COMMUNITY_ACTIVITIES: CommunityActivity[] = [
  {
    id: 'ca-001',
    title: 'Community Emergency Preparedness Workshop',
    organizer: 'Jurong West RC',
    organizerType: 'grassroots',
    category: 'preparedness',
    description: 'Learn basic first aid, evacuation procedures, and how to assemble a 72-hour emergency kit. Conducted by SCDF-certified trainers.',
    location: 'Jurong West CC, Multi-Purpose Hall 1',
    date: 'Sat, 24 May',
    time: '9:00 AM – 12:00 PM',
    maxParticipants: 60,
    registered: 38,
    tags: ['First Aid', 'Preparedness', 'Free'],
    contactPhone: '+65 6560 1234',
  },
  {
    id: 'ca-002',
    title: 'Flood Relief Donation Drive',
    organizer: 'Singapore Red Cross',
    organizerType: 'ngo',
    category: 'relief',
    description: 'Drop off essential items for flood-affected families: bottled water, non-perishable food, toiletries, and clean clothing.',
    location: 'Clementi MRT Station (Exit A)',
    date: 'Today & Tomorrow',
    time: '9:00 AM – 9:00 PM',
    maxParticipants: 999,
    registered: 142,
    tags: ['Donations', 'Flood Relief', 'Walk-in'],
    contactPhone: '+65 6336 0269',
  },
  {
    id: 'ca-003',
    title: 'Psychological First Aid Training',
    organizer: 'SAMH',
    organizerType: 'ngo',
    category: 'training',
    description: 'Free half-day training on how to support disaster survivors emotionally. Open to all community members. Certificate provided.',
    location: 'Online (Zoom)',
    date: 'Sun, 25 May',
    time: '2:00 PM – 5:00 PM',
    maxParticipants: 200,
    registered: 87,
    tags: ['Mental Health', 'Training', 'Online', 'Certificate'],
    contactEmail: 'training@samh.org.sg',
  },
  {
    id: 'ca-004',
    title: 'Neighbourhood Watch Reactivation',
    organizer: 'Bukit Batok Town Council',
    organizerType: 'government',
    category: 'awareness',
    description: 'Reactivate neighbourhood watch groups to monitor and report hazards early. Coordinators receive a direct line to the Town Council ops team.',
    location: 'Bukit Batok CC',
    date: 'Wed, 28 May',
    time: '7:30 PM – 9:00 PM',
    maxParticipants: 50,
    registered: 21,
    tags: ['Community', 'Watch', 'Free'],
    contactPhone: '+65 6569 9000',
  },
  {
    id: 'ca-005',
    title: 'Corporate Volunteer Pledge – Logistics Support',
    organizer: 'DHL Singapore',
    organizerType: 'corporate',
    category: 'relief',
    description: 'DHL is pledging 50 corporate volunteers with vehicles to assist in supply distribution. Community members can register their own vehicles.',
    location: 'Pandan Logistics Hub',
    date: 'This Weekend',
    time: '7:00 AM – 7:00 PM',
    maxParticipants: 80,
    registered: 54,
    tags: ['Logistics', 'Driving', 'Supplies'],
    contactEmail: 'volunteer@dhl.com.sg',
  },
];

// ─── Alert guide modal (for incidents) ────────────────────────────────────────

function AlertGuideModal({ incident, onClose }: { incident: IncidentListItem; onClose: () => void }) {
  const guide = ALERT_GUIDES[incident.type] || ALERT_GUIDES['other'];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[88vh] overflow-auto">
        <div className="sticky top-0 bg-white rounded-t-xl border-b border-paper-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={guide.color}>{guide.icon}</span>
            <div>
              <h2 className="font-semibold text-ink text-sm">{incident.title}</h2>
              <p className="text-[11px] text-ink-muted">{guide.title} Safety Guide</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-5">
          <div className="bg-paper rounded-sm p-3 text-xs text-ink-muted space-y-1">
            <div className="flex items-center gap-1.5"><MapPin size={11} />{incident.locationText}</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Clock size={11} />
              {new Date(incident.createdAt).toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              <span>·</span><span className="font-medium text-ink">{formatIncidentType(incident.type)}</span>
              <span>·</span><span>{formatSeverity(incident.severity)}</span>
            </div>
          </div>

          <section>
            <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-3 flex items-center gap-2">
              <CheckCircle size={13} className="text-teal" /> What to do
            </h3>
            <div className="space-y-3">
              {guide.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{step.heading}</p>
                    <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-3 flex items-center gap-2">
              <X size={13} className="text-red" /> Do NOT
            </h3>
            <div className="bg-red-light rounded-sm p-3 space-y-2">
              {guide.doNot.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-dark">
                  <span className="font-bold shrink-0 mt-0.5">✕</span>{item}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-3 flex items-center gap-2">
              <Phone size={13} /> Emergency Contacts
            </h3>
            <div className="space-y-2">
              {guide.contacts.map(c => (
                <a key={c.number} href={`tel:${c.number.replace(/\s/g, '')}`}
                  className="flex items-center justify-between bg-navy text-white rounded-sm px-4 py-3 hover:bg-navy-mid transition-colors">
                  <span className="text-sm font-medium">{c.label}</span>
                  <span className="font-mono font-bold text-teal text-lg">{c.number}</span>
                </a>
              ))}
            </div>
          </section>

          <button onClick={onClose}
            className="w-full py-2.5 bg-paper border border-paper-border rounded-sm text-sm font-medium text-ink-muted hover:bg-paper-hover">
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Broadcast card (opens detail modal on click) ──────────────────────────────

function BroadcastCard({
  broadcast,
  onOpenDetail,
}: {
  broadcast: Broadcast;
  onOpenDetail: () => void;
}) {
  const advisoryType = inferAdvisoryType(broadcast);
  const advisory     = ADVISORY_CONTENT[advisoryType] || ADVISORY_CONTENT.general;

  const severityCls: Record<string, string> = {
    critical: 'border-l-4 border-l-red',
    high:     'border-l-4 border-l-orange-500',
    moderate: 'border-l-4 border-l-amber',
    info:     'border-l-4 border-l-navy',
  };

  return (
    <button
      onClick={onOpenDetail}
      className={`w-full text-left bg-white border border-paper-border rounded-sm p-3.5
        hover:bg-paper-hover transition-colors ${severityCls[advisory.severity]}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">{advisory.icon}</span>
          <p className="text-sm font-semibold text-ink leading-snug">{broadcast.title}</p>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide
          ${advisory.severity === 'critical' ? 'bg-red text-white' :
            advisory.severity === 'high'     ? 'bg-orange-600 text-white' :
            advisory.severity === 'moderate' ? 'bg-amber text-white' :
                                               'bg-navy text-white'}`}>
          {advisory.severity === 'critical' ? 'Critical' :
           advisory.severity === 'high'     ? 'High' :
           advisory.severity === 'moderate' ? 'Advisory' : 'Notice'}
        </span>
      </div>

      <p className="text-xs text-ink-muted line-clamp-2 mb-2 pl-7">{broadcast.message}</p>

      <div className="flex items-center justify-between pl-7">
        <p className="text-[11px] text-ink-muted">
          {broadcast.sentBy.name} ·{' '}
          {new Date(broadcast.createdAt).toLocaleString('en-SG', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </p>
        <span className="text-[11px] text-teal font-semibold flex items-center gap-1">
          View advisory <ArrowRight size={11} />
        </span>
      </div>
    </button>
  );
}

// ─── Alerts view ───────────────────────────────────────────────────────────────

function PublicIncidentCard({ incident, onClick }: { incident: IncidentListItem; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className={`bg-white border border-paper-border rounded-sm p-3.5 border-l-4
        ${getSeverityBorderColor(incident.severity)} cursor-pointer hover:bg-paper-hover transition-colors`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-medium text-ink">{incident.title}</p>
        <StatusBadge status={incident.status} />
      </div>
      <div className="space-y-1 text-xs text-ink-muted">
        <div className="flex items-center gap-1.5"><MapPin size={11} />{incident.locationText}</div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Clock size={11} />
          {new Date(incident.createdAt).toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          <span>·</span><span className="font-medium">{formatIncidentType(incident.type)}</span>
          <span>·</span><span>{formatSeverity(incident.severity)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 text-[11px] text-teal font-semibold">
        <BookOpen size={11} /> Tap for safety guide
      </div>
    </div>
  );
}

function AlertsView({
  broadcasts, incidents, incidentsLoading, broadcastsLoading,
}: {
  broadcasts: Broadcast[];
  incidents: IncidentListItem[];
  incidentsLoading: boolean;
  broadcastsLoading: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const [selectedIncident,  setSelectedIncident]  = useState<IncidentListItem | null>(null);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);

  const publicIncidents = incidents.filter(i => i.status !== 'closed');
  const visible = showAll ? publicIncidents : publicIncidents.slice(0, 5);

  return (
    <div className="space-y-6">

      {/* ── Official Broadcasts ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-semibold text-ink-muted uppercase flex items-center gap-2">
            <Megaphone size={13} /> Official Broadcasts
          </h2>
          <span className="text-[10px] text-ink-muted">Tap to view full advisory</span>
        </div>

        {broadcastsLoading ? (
          <LoadingSpinner label="Loading broadcasts…" />
        ) : broadcasts.length === 0 ? (
          <EmptyBox icon={<Megaphone size={28} />} message="No active broadcasts" />
        ) : (
          <div className="space-y-2.5">
            {broadcasts.slice(0, 8).map(b => (
              <BroadcastCard
                key={b.id}
                broadcast={b}
                onOpenDetail={() => setSelectedBroadcast(b)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Active Incidents ── */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-mono font-semibold text-ink-muted uppercase flex items-center gap-2">
            <AlertTriangle size={13} /> Active Incidents
            {publicIncidents.length > 0 && (
              <span className="bg-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {publicIncidents.length}
              </span>
            )}
          </h2>
        </div>
        <p className="text-xs text-ink-muted mb-3">Tap an incident for situation-specific safety guidance.</p>

        {incidentsLoading ? (
          <LoadingSpinner label="Loading incidents…" />
        ) : visible.length === 0 ? (
          <EmptyBox icon={<Shield size={28} />} message="No active incidents — all clear" />
        ) : (
          <>
            <div className="space-y-2.5">
              {visible.map(i => (
                <PublicIncidentCard key={i.id} incident={i} onClick={() => setSelectedIncident(i)} />
              ))}
            </div>
            {publicIncidents.length > 5 && (
              <button onClick={() => setShowAll(s => !s)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-teal font-medium py-2 hover:underline">
                {showAll
                  ? <><ChevronUp size={13} /> Show less</>
                  : <><ChevronDown size={13} /> Show all {publicIncidents.length}</>}
              </button>
            )}
          </>
        )}
      </section>

      {/* ── Stay informed banner ── */}
      <div className="bg-navy-light border border-navy-border rounded-sm p-4 flex gap-3">
        <Info size={15} className="text-navy-mid shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-navy-mid mb-1">Stay informed through official channels</p>
          <p className="text-xs text-navy-mid opacity-80 leading-relaxed">
            Call <strong>995</strong> for fire / medical, <strong>999</strong> for police.
            Tune to <strong>938Live</strong> or <strong>CNA938</strong> for live updates.
            Follow <strong>gov.sg WhatsApp</strong> for advisories.
          </p>
        </div>
      </div>

      {/* ── Modals ── */}
      {selectedIncident && (
        <AlertGuideModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
      {selectedBroadcast && (
        <BroadcastDetailModal broadcast={selectedBroadcast} onClose={() => setSelectedBroadcast(null)} />
      )}
    </div>
  );
}

// ─── Communities view ──────────────────────────────────────────────────────────

const ORG_TYPE_STYLES: Record<string, { label: string; cls: string }> = {
  grassroots: { label: 'Grassroots', cls: 'bg-teal-light text-teal-dark' },
  ngo:        { label: 'NGO',        cls: 'bg-amber-light text-amber-dark' },
  government: { label: 'Government', cls: 'bg-navy-light text-navy-mid' },
  religious:  { label: 'Religious',  cls: 'bg-purple-100 text-purple-700' },
  corporate:  { label: 'Corporate',  cls: 'bg-paper text-ink-muted' },
};

const CATEGORY_STYLES: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  preparedness: { label: 'Preparedness', icon: <Shield size={11} />,      cls: 'bg-navy-light text-navy-mid'     },
  relief:       { label: 'Relief',       icon: <Heart size={11} />,       cls: 'bg-red-light text-red-dark'      },
  recovery:     { label: 'Recovery',     icon: <CheckCircle size={11} />, cls: 'bg-teal-light text-teal-dark'    },
  awareness:    { label: 'Awareness',    icon: <Megaphone size={11} />,   cls: 'bg-amber-light text-amber-dark'  },
  training:     { label: 'Training',     icon: <BookOpen size={11} />,    cls: 'bg-purple-100 text-purple-700'   },
};

function CommunityActivityCard({
  activity, onSelect,
}: {
  activity: CommunityActivity;
  onSelect: () => void;
}) {
  const orgStyle = ORG_TYPE_STYLES[activity.organizerType] || ORG_TYPE_STYLES.grassroots;
  const catStyle = CATEGORY_STYLES[activity.category]      || CATEGORY_STYLES.awareness;
  const spotsLeft = activity.maxParticipants - activity.registered;
  const fillPct   = Math.round((activity.registered / Math.max(activity.maxParticipants, 1)) * 100);
  const full      = spotsLeft <= 0;

  return (
    <div onClick={() => !full && onSelect()}
      className={`bg-white border border-paper-border rounded-sm p-4 transition-colors
        ${full ? 'opacity-60' : 'cursor-pointer hover:bg-paper-hover'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-ink text-sm leading-snug flex-1">{activity.title}</h3>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${catStyle.cls}`}>
          {catStyle.icon}{catStyle.label}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-2">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${orgStyle.cls}`}>{activity.organizer}</span>
      </div>
      <div className="space-y-0.5 text-xs text-ink-muted mb-3">
        <div className="flex items-center gap-1.5"><MapPin size={11} />{activity.location}</div>
        <div className="flex items-center gap-1.5"><Clock  size={11} />{activity.date} · {activity.time}</div>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {activity.tags.map(t => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 bg-paper-border text-ink-muted rounded">{t}</span>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-ink-muted">
            {activity.registered}/{activity.maxParticipants === 999 ? '∞' : activity.maxParticipants} registered
          </span>
          <span className={`font-semibold ${full ? 'text-red' : 'text-teal-dark'}`}>
            {full ? 'Full' : activity.maxParticipants === 999 ? 'Open' : `${spotsLeft} spots left`}
          </span>
        </div>
        {activity.maxParticipants !== 999 && (
          <div className="h-1.5 bg-paper-border rounded-full overflow-hidden">
            <div className="h-full bg-teal rounded-full" style={{ width: `${fillPct}%` }} />
          </div>
        )}
      </div>
      {!full && (
        <p className="text-[11px] text-teal font-semibold mt-2 flex items-center gap-1">
          Tap to view & register <ArrowRight size={11} />
        </p>
      )}
    </div>
  );
}

function ActivityDetailModal({
  activity, onClose,
}: {
  activity: CommunityActivity;
  onClose: () => void;
}) {
  const [form, setForm]       = useState({ name: '', phone: '', email: '' });
  const [done, setDone]       = useState(false);
  const [submitting, setSub]  = useState(false);
  const orgStyle = ORG_TYPE_STYLES[activity.organizerType] || ORG_TYPE_STYLES.grassroots;
  const catStyle = CATEGORY_STYLES[activity.category]      || CATEGORY_STYLES.awareness;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSub(true);
    setTimeout(() => { setDone(true); setSub(false); }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white rounded-t-xl border-b border-paper-border px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink text-sm truncate pr-2">{activity.title}</h2>
          <button onClick={onClose} className="shrink-0 text-ink-muted hover:text-ink"><X size={18} /></button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={32} className="text-teal" />
            </div>
            <h3 className="font-semibold text-ink text-lg mb-1">Registered!</h3>
            <p className="text-sm text-ink-muted mb-1">The organiser will reach out to confirm details.</p>
            <button onClick={onClose} className="mt-5 w-full py-2.5 bg-teal text-white rounded-sm text-sm font-semibold">Done</button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${catStyle.cls}`}>
                {catStyle.icon}{catStyle.label}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${orgStyle.cls}`}>{activity.organizer}</span>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">{activity.description}</p>
            <div className="bg-paper rounded-sm p-3 space-y-1.5 text-xs text-ink-muted">
              <div className="flex gap-1.5 items-center"><MapPin size={11} />{activity.location}</div>
              <div className="flex gap-1.5 items-center"><Clock  size={11} />{activity.date} · {activity.time}</div>
              {activity.contactPhone && (
                <a href={`tel:${activity.contactPhone}`} className="flex gap-1.5 items-center text-teal hover:underline">
                  <Phone size={11} />{activity.contactPhone}
                </a>
              )}
              {activity.contactEmail && (
                <a href={`mailto:${activity.contactEmail}`} className="flex gap-1.5 items-center text-teal hover:underline">
                  <ExternalLink size={11} />{activity.contactEmail}
                </a>
              )}
            </div>
            <hr className="border-paper-border" />
            <p className="text-xs font-semibold text-ink">Register your interest</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { id: 'name',  label: 'Full Name',     type: 'text',  placeholder: 'John Tan' },
                { id: 'phone', label: 'Mobile Number', type: 'tel',   placeholder: '+65 9123 4567' },
                { id: 'email', label: 'Email',         type: 'email', placeholder: 'john@example.com' },
              ].map(f => (
                <div key={f.id}>
                  <label className="block text-xs font-medium text-ink mb-1">{f.label} *</label>
                  <input type={f.type} required placeholder={f.placeholder}
                    value={(form as any)[f.id]}
                    onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                    className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>
              ))}
              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-teal text-white font-semibold rounded-sm text-sm hover:bg-teal-dark disabled:opacity-50 transition-colors">
                {submitting ? 'Submitting…' : 'Confirm Registration'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function CommunitiesView({ activities }: { activities: CommunityActivity[] }) {
  const [selectedActivity,  setSelectedActivity]  = useState<CommunityActivity | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const categories = ['all', ...Array.from(new Set(activities.map(a => a.category)))];
  const filtered   = filterCategory === 'all' ? activities : activities.filter(a => a.category === filterCategory);

  return (
    <div className="space-y-5">
      <div className="bg-navy text-white rounded-sm p-4">
        <h2 className="font-semibold text-sm mb-1">Community Resilience Hub</h2>
        <p className="text-xs opacity-90 leading-relaxed">
          Volunteer, train, and support relief activities organised by community groups and agencies near you.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => {
          const cfg = CATEGORY_STYLES[cat];
          return (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all
                ${filterCategory === cat ? 'bg-navy text-white border-navy' : 'bg-white text-ink-muted border-paper-border hover:border-navy'}`}>
              {cfg && <span>{cfg.icon}</span>}
              {cat === 'all' ? 'All' : cfg?.label ?? cat}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyBox icon={<Users size={28} />} message="No activities in this category" />
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <CommunityActivityCard key={a.id} activity={a} onSelect={() => setSelectedActivity(a)} />
          ))}
        </div>
      )}

      <div className="bg-teal-light border border-teal rounded-sm p-3 flex gap-3">
        <Info size={14} className="text-teal-dark shrink-0 mt-0.5" />
        <p className="text-xs text-teal-dark leading-relaxed">
          Organising a relief or preparedness activity?{' '}
          <a href="mailto:community@quickaid.sg" className="font-semibold underline">Contact us</a> to list your event here.
        </p>
      </div>

      {selectedActivity && (
        <ActivityDetailModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
      )}
    </div>
  );
}

// ─── Volunteer view ────────────────────────────────────────────────────────────

const URGENCY_CFG: Record<string, { bar: string; badge: string; label: string }> = {
  critical: { bar: 'bg-red',   badge: 'bg-red-light text-red-dark border-red',         label: 'Critical' },
  high:     { bar: 'bg-amber', badge: 'bg-amber-light text-amber-dark border-amber',   label: 'Urgent'   },
  medium:   { bar: 'bg-teal',  badge: 'bg-teal-light text-teal-dark border-teal',      label: 'Needed'   },
  low:      { bar: 'bg-navy',  badge: 'bg-navy-light text-navy-mid border-navy-border', label: 'Open'    },
};

const ORG_ICONS: Record<string, React.ReactNode> = {
  government: <Building2 size={12} className="text-navy-mid" />,
  ngo:        <Heart     size={12} className="text-red"      />,
  healthcare: <Activity  size={12} className="text-teal"     />,
  community:  <Users     size={12} className="text-amber-dark" />,
};

function TaskCard({ task, onSelect }: { task: VolunteerTask; onSelect: (t: VolunteerTask) => void }) {
  const cfg      = URGENCY_CFG[task.urgency] || URGENCY_CFG.low;
  const slotsLeft = task.slotsTotal - task.slotsFilled;
  const fillPct   = Math.round((task.slotsFilled / Math.max(task.slotsTotal, 1)) * 100);
  const full      = slotsLeft <= 0;

  return (
    <div onClick={() => !full && onSelect(task)}
      className={`bg-white border border-paper-border rounded-sm p-4 transition-colors
        ${full ? 'opacity-60' : 'cursor-pointer hover:bg-paper-hover'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-ink text-sm leading-snug">{task.title}</h3>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${cfg.badge}`}>{cfg.label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-2">
        {ORG_ICONS[task.orgType]}<span>{task.organization}</span>
      </div>
      <div className="space-y-0.5 text-xs text-ink-muted mb-3">
        <div className="flex items-center gap-1.5"><MapPin size={11} />{task.location}</div>
        <div className="flex items-center gap-1.5"><Clock  size={11} />{task.date} · {task.timeSlot}</div>
      </div>
      {task.skillsRequired.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.skillsRequired.map(s => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 bg-paper-border text-ink-muted rounded">{s}</span>
          ))}
        </div>
      )}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-ink-muted">{task.slotsFilled}/{task.slotsTotal} slots filled</span>
          <span className={`font-semibold ${full ? 'text-red' : 'text-teal-dark'}`}>{full ? 'Full' : `${slotsLeft} left`}</span>
        </div>
        <div className="h-1.5 bg-paper-border rounded-full overflow-hidden">
          <div className={`h-full ${cfg.bar} rounded-full`} style={{ width: `${fillPct}%` }} />
        </div>
      </div>
      {!full && <p className="text-[11px] text-teal font-semibold mt-2">Tap to sign up →</p>}
    </div>
  );
}

function TaskSignupModal({ task, onClose }: { task: VolunteerTask; onClose: () => void }) {
  const [form, setForm] = useState({ fullName: '', phone: '', nric: '' });
  const [done, setDone] = useState<string | null>(null);
  const { mutate, isPending } = useSignUpForTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ taskId: task.id, ...form }, { onSuccess: res => setDone(res.confirmationCode) });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-paper-border sticky top-0 bg-white rounded-t-xl">
          <h2 className="font-semibold text-ink text-sm truncate pr-2">{task.title}</h2>
          <button onClick={onClose} className="shrink-0 text-ink-muted hover:text-ink"><X size={18} /></button>
        </div>
        {done ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={32} className="text-teal" />
            </div>
            <h3 className="font-semibold text-ink text-lg mb-1">You're registered!</h3>
            <p className="text-sm text-ink-muted mb-1">Your confirmation code:</p>
            <p className="font-mono text-2xl font-bold text-navy tracking-widest my-2">{done}</p>
            <p className="text-xs text-ink-muted">Show this at check-in.</p>
            <button onClick={onClose} className="mt-5 w-full py-2.5 bg-teal text-white rounded-sm text-sm font-semibold">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <p className="text-sm text-ink-muted leading-relaxed">{task.description}</p>
            <div className="text-xs text-ink-muted bg-paper p-3 rounded-sm space-y-1">
              <div className="flex gap-1.5 items-center"><MapPin size={11} />{task.location}</div>
              <div className="flex gap-1.5 items-center"><Clock  size={11} />{task.date} · {task.timeSlot}</div>
            </div>
            <hr className="border-paper-border" />
            {[
              { id: 'fullName', label: 'Full Name (as per NRIC)', type: 'text', placeholder: 'John Tan Wei Ming' },
              { id: 'phone',    label: 'Mobile Number',           type: 'tel',  placeholder: '+65 9123 4567' },
              { id: 'nric',     label: 'NRIC / FIN / Passport',   type: 'text', placeholder: 'S1234567A' },
            ].map(f => (
              <div key={f.id}>
                <label className="block text-xs font-medium text-ink mb-1">{f.label} *</label>
                <input type={f.type} required placeholder={f.placeholder}
                  value={(form as any)[f.id]}
                  onChange={e => setForm(prev => ({ ...prev, [f.id]: e.target.value }))}
                  className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
            ))}
            <button type="submit" disabled={isPending}
              className="w-full py-3 bg-teal text-white font-semibold rounded-sm text-sm hover:bg-teal-dark disabled:opacity-50 transition-colors">
              {isPending ? 'Submitting…' : 'Confirm Sign-Up'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function VolunteerView({
  tasks, isLoading, onRegister,
}: {
  tasks: VolunteerTask[];
  isLoading: boolean;
  onRegister: () => void;
}) {
  const [selectedTask, setSelectedTask] = useState<VolunteerTask | null>(null);
  const urgent = tasks.filter(t => t.urgency === 'critical' || t.urgency === 'high');
  const other  = tasks.filter(t => t.urgency === 'medium'   || t.urgency === 'low');

  return (
    <div className="space-y-5">
      <div className="bg-teal text-white rounded-sm p-4">
        <h2 className="font-semibold text-sm mb-1">Be part of the response</h2>
        <p className="text-xs opacity-90 leading-relaxed mb-3">
          Sign up for a specific task below, or register your skills for future deployment.
        </p>
        <button onClick={onRegister}
          className="px-4 py-1.5 bg-white text-teal text-xs font-semibold rounded-sm hover:bg-teal-light transition-colors">
          Register as Volunteer →
        </button>
      </div>

      {isLoading ? <LoadingSpinner label="Loading volunteer tasks…" /> :
        tasks.length === 0 ? <EmptyBox icon={<Heart size={28} />} message="No volunteer tasks right now" /> : (
          <>
            {urgent.length > 0 && (
              <section>
                <h2 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-3 flex items-center gap-2">
                  <AlertTriangle size={13} /> 🚨 Urgently Needed
                </h2>
                <div className="space-y-3">
                  {urgent.map(t => <TaskCard key={t.id} task={t} onSelect={setSelectedTask} />)}
                </div>
              </section>
            )}
            {other.length > 0 && (
              <section>
                <h2 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-3 flex items-center gap-2">
                  <Heart size={13} /> Other Opportunities
                </h2>
                <div className="space-y-3">
                  {other.map(t => <TaskCard key={t.id} task={t} onSelect={setSelectedTask} />)}
                </div>
              </section>
            )}
          </>
        )}
      {selectedTask && <TaskSignupModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

// ─── Report view ───────────────────────────────────────────────────────────────

function ReportView({ onOpenForm }: { onOpenForm: () => void }) {
  const hotlines = [
    { label: 'Fire & Rescue / Ambulance', number: '995',           color: 'bg-red',       desc: 'Life-threatening emergencies'   },
    { label: 'Police',                    number: '999',           color: 'bg-navy',      desc: 'Crime / security threats'        },
    { label: 'SCDF Non-Emergency',        number: '1777',          color: 'bg-amber-dark', desc: 'Flood, fallen trees, hazmat'   },
    { label: 'MOH Health Advisory',       number: '1800 333 9999', color: 'bg-teal',      desc: 'Health / disease queries'        },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-red-light border border-red rounded-sm p-4">
        <p className="text-sm font-semibold text-red-dark mb-1">⚠ Call 995 for life-threatening emergencies first.</p>
        <p className="text-xs text-red-dark opacity-80 leading-relaxed">
          This digital form is for non-urgent incident reporting to help our operations team
          track and coordinate resources. It is NOT monitored in real time.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-3 flex items-center gap-2">
          <Phone size={13} /> Emergency Hotlines
        </h2>
        <div className="space-y-2">
          {hotlines.map(c => (
            <a key={c.number} href={`tel:${c.number.replace(/\s/g, '')}`}
              className="flex items-center gap-3 bg-white border border-paper-border rounded-sm p-3 hover:bg-paper-hover transition-colors">
              <div className={`w-10 h-10 ${c.color} rounded-sm flex items-center justify-center shrink-0`}>
                <Phone size={17} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{c.label}</p>
                <p className="text-xs text-ink-muted">{c.desc}</p>
              </div>
              <span className="font-mono font-bold text-ink text-sm shrink-0">{c.number}</span>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-3 flex items-center gap-2">
          <AlertTriangle size={13} /> Digital Incident Report
        </h2>
        <p className="text-xs text-ink-muted mb-3 leading-relaxed">
          Use this for non-urgent reports: fallen tree blocking road, minor flooding, suspicious packages, etc.
        </p>
        <button onClick={onOpenForm}
          className="w-full py-3 bg-navy text-white font-semibold rounded-sm text-sm hover:bg-navy-dark transition-colors flex items-center justify-center gap-2">
          <Plus size={15} /> Submit Incident Report
        </button>
      </section>

      <section>
        <h2 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-3 flex items-center gap-2">
          <Info size={13} /> Official Resources
        </h2>
        <div className="space-y-2">
          {[
            { label: 'SCDF — Flood / Fire Portal',       href: 'https://www.scdf.gov.sg' },
            { label: 'MOH — Health Alerts',              href: 'https://www.moh.gov.sg' },
            { label: 'PUB — MyWaters Flood Map',         href: 'https://www.pub.gov.sg' },
            { label: 'SPF — Safety & Security Updates',  href: 'https://www.spf.gov.sg' },
            { label: 'Gov.sg WhatsApp Updates',          href: 'https://www.gov.sg' },
          ].map(l => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer"
              className="flex items-center justify-between bg-white border border-paper-border rounded-sm px-3 py-2.5 hover:bg-paper-hover text-sm text-ink font-medium">
              {l.label}
              <ExternalLink size={13} className="text-teal flex-shrink-0" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Incident Report Form ──────────────────────────────────────────────────────

function IncidentReportForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', locationText: '',
    type: 'other' as IncidentType, severity: '3',
    estimatedCasualties: '', contactInfo: '',
  });
  const [ticketNumber, setTicketNumber] = useState('');
  const [submitted, setSubmitted]       = useState(false);
  const { mutate: createIncident, isPending, error } = useCreateIncident();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIncident(
      { ...form, severity: parseInt(form.severity) as any,
        estimatedCasualties: form.estimatedCasualties ? parseInt(form.estimatedCasualties) : undefined },
      { onSuccess: res => { setTicketNumber(res.ticketNumber || ''); setSubmitted(true); } }
    );
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Send size={28} className="text-teal" />
          </div>
          <h3 className="text-lg font-semibold text-ink mb-1">Report Submitted</h3>
          {ticketNumber && (
            <>
              <p className="text-xs text-ink-muted mb-1">Your ticket number:</p>
              <p className="font-mono text-xl font-bold text-navy tracking-wider my-2">{ticketNumber}</p>
            </>
          )}
          <p className="text-sm text-ink-muted mb-4 leading-relaxed">
            Our operations team will review your report. Keep your ticket number for reference.
          </p>
          <button onClick={onClose} className="w-full py-2.5 bg-teal text-white rounded-sm font-semibold text-sm">Close</button>
        </div>
      </div>
    );
  }

  const TYPES = [
    { value: 'medical', label: 'Medical', emoji: '🏥' }, { value: 'fire',  label: 'Fire',      emoji: '🔥' },
    { value: 'flood',   label: 'Flood',   emoji: '🌊' }, { value: 'road',  label: 'Road',       emoji: '🚗' },
    { value: 'infrastructure', label: 'Infra', emoji: '🏗️' },
    { value: 'civil',  label: 'Civil',   emoji: '👥' }, { value: 'other', label: 'Other',      emoji: '📋' },
  ];
  const SEVERITIES = [
    { value: '1', label: 'Critical', sub: 'Life-threatening',  cls: 'border-red   bg-red-light   text-red-dark'   },
    { value: '2', label: 'Serious',  sub: 'Urgent response',   cls: 'border-amber bg-amber-light text-amber-dark' },
    { value: '3', label: 'Minor',    sub: 'Non-urgent',        cls: 'border-teal  bg-teal-light  text-teal-dark'  },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="h-14 bg-navy flex items-center justify-between px-4 rounded-t-xl sticky top-0">
          <h2 className="text-white font-semibold">Incident Report</h2>
          <button onClick={onClose}><X size={20} className="text-white opacity-80 hover:opacity-100" /></button>
        </div>
        <div className="bg-amber-light border-b border-amber px-4 py-2.5">
          <p className="text-xs text-amber-dark font-medium">⚠ Life-threatening? Call <strong>995</strong> FIRST.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Incident type *</label>
            <div className="grid grid-cols-4 gap-1.5">
              {TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value as IncidentType }))}
                  className={`p-2 rounded-sm border-2 text-center transition-all ${
                    form.type === t.value ? 'border-navy bg-navy-light' : 'border-paper-border hover:border-navy-border'}`}>
                  <div className="text-lg">{t.emoji}</div>
                  <div className="text-[10px] font-medium mt-0.5">{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">How serious? *</label>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITIES.map(s => (
                <button key={s.value} type="button"
                  onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                  className={`p-3 rounded-sm border-2 text-center transition-all ${
                    form.severity === s.value ? s.cls : 'border-paper-border hover:border-paper-hover'}`}>
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-80">{s.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {[
            { key: 'title',        label: 'Brief title *',  type: 'text', placeholder: 'e.g. Fallen tree blocking PIE', required: true },
            { key: 'locationText', label: 'Location *',     type: 'text', placeholder: 'Address or landmark',           required: true },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-ink mb-1">{f.label}</label>
              <input type={f.type} required={f.required} placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Description *</label>
            <textarea required rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe what you see. Include how many people are affected if known."
              className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Your contact (for follow-up) *</label>
            <input type="text" required value={form.contactInfo}
              onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))}
              placeholder="Name and mobile number"
              className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          {error && <p className="text-xs text-red bg-red-light p-2.5 rounded-sm">Submission failed. Please try again or call 995.</p>}

          <button type="submit" disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-navy text-white font-semibold rounded-sm text-sm hover:bg-navy-dark transition-colors disabled:opacity-50">
            {isPending
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
              : <><Send size={15} /> Submit Report</>}
          </button>
          <p className="text-[11px] text-ink-muted text-center leading-relaxed">
            Personal data collected under the PDPA for emergency coordination only.
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      <p className="text-ink-muted mt-2 text-sm">{label}</p>
    </div>
  );
}

function EmptyBox({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-ink-muted">
      <div className="mb-3 opacity-30">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Main PublicPortal ─────────────────────────────────────────────────────────

export function PublicPortal() {
  const [tab, setTab]                   = useState<'alerts' | 'communities' | 'volunteer' | 'report'>('alerts');
  const [showVolunteerForm, setVolForm] = useState(false);
  const [showReportForm, setReport]     = useState(false);

  const { data: incData,   isLoading: incL  } = useIncidents({ limit: 30 });
  const { data: taskData,  isLoading: taskL } = useVolunteerTasks();
  const { data: bcastData, isLoading: bcastL } = useBroadcasts({ limit: 20 });

  const incidents  = incData?.incidents   || [];
  const tasks      = taskData?.tasks      || [];
  const broadcasts = bcastData?.broadcasts || [];

  const hasEmergency = incidents.some(
    i => i.severity <= 2 && i.status !== 'resolved' && i.status !== 'closed'
  );

  const TABS: { id: typeof tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'alerts',      label: 'Alerts',      icon: <Megaphone     size={14} />, count: broadcasts.length },
    { id: 'communities', label: 'Communities', icon: <Users         size={14} /> },
    { id: 'volunteer',   label: 'Volunteer',   icon: <Heart         size={14} />, count: tasks.filter(t => t.status !== 'full' && t.status !== 'completed').length },
    { id: 'report',      label: 'Report',      icon: <AlertTriangle size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-md mx-auto border-x border-paper-border min-h-screen relative pb-24">

        {/* Emergency banner */}
        {hasEmergency && (
          <div className="bg-red text-white px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={15} className="flex-shrink-0 animate-pulse" />
            <p className="text-xs font-semibold flex-1">
              Active emergency in your area — stay informed and follow official instructions.
            </p>
            <a href="tel:995" className="text-xs underline font-bold flex-shrink-0">Call 995</a>
          </div>
        )}

        {/* Header */}
        <header className="bg-white border-b border-paper-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-navy rounded-sm flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-navy leading-none">QuickAid</h1>
              <p className="text-[10px] text-ink-muted">Singapore Emergency Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="tel:995"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red text-white text-xs font-bold rounded-sm hover:bg-red-dark transition-colors">
              <Phone size={12} /> 995
            </a>
            <Link to="/login"
              className="px-2.5 py-1.5 border border-paper-border rounded-sm text-xs font-medium text-ink hover:bg-paper-hover transition-colors">
              Login
            </Link>
          </div>
        </header>

        {/* Active broadcast ticker */}
        {broadcasts.length > 0 && (
          <div className="bg-amber-light border-b border-amber px-4 py-2 flex items-center gap-2">
            <Megaphone size={13} className="text-amber-dark shrink-0" />
            <p className="text-xs font-semibold text-amber-dark truncate">{broadcasts[0].title}</p>
            <button onClick={() => setTab('alerts')} className="text-[11px] text-amber-dark underline shrink-0">View</button>
          </div>
        )}

        {/* Tab navigation */}
        <nav className="bg-white border-b border-paper-border">
          <div className="flex">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors relative ${
                  tab === t.id ? 'text-teal border-b-2 border-teal' : 'text-ink-muted hover:text-ink'
                }`}>
                {t.icon}
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`absolute top-1 right-2 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center
                    ${tab === t.id ? 'bg-teal text-white' : 'bg-paper-border text-ink-muted'}`}>
                    {t.count > 9 ? '9+' : t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="p-4">
          {tab === 'alerts' && (
            <AlertsView
              broadcasts={broadcasts} incidents={incidents}
              incidentsLoading={incL} broadcastsLoading={bcastL}
            />
          )}
          {tab === 'communities' && <CommunitiesView activities={MOCK_COMMUNITY_ACTIVITIES} />}
          {tab === 'volunteer'   && (
            <VolunteerView tasks={tasks} isLoading={taskL} onRegister={() => setVolForm(true)} />
          )}
          {tab === 'report' && <ReportView onOpenForm={() => setReport(true)} />}
        </div>

        {/* Report FAB */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-paper-border px-4 py-3">
          <button onClick={() => setReport(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red text-white
              font-bold rounded-sm hover:bg-red-dark transition-colors text-sm shadow-md">
            <AlertTriangle size={16} /> Report an Emergency
          </button>
        </div>
      </div>

      {/* Modals */}
      {showVolunteerForm && (
        <VolunteerRegistration onClose={() => setVolForm(false)} onSuccess={() => setVolForm(false)} />
      )}
      {showReportForm && <IncidentReportForm onClose={() => setReport(false)} />}
    </div>
  );
}