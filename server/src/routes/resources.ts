import { Router } from 'express';
import { query } from '../config/db.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import crypto from 'crypto';

const router = Router();

// ─── Transformers ──────────────────────────────────────────────────────────────

function toHospital(h: any) {
  return {
    id: h.id, name: h.name, shortName: h.short_name,
    address: h.address, phone: h.phone || '',
    lat: parseFloat(h.lat), lng: parseFloat(h.lng),
    totalBeds: h.total_beds, availableBeds: h.available_beds,
    icuAvailable: h.icu_available, traumaBays: h.trauma_bays,
    lastUpdatedAt: h.last_updated_at, createdAt: h.created_at,
  };
}

function toVolunteer(v: any) {
  return {
    id: v.id, userId: v.user_id, fullName: v.full_name, phone: v.phone,
    skills: v.skills, postalDistrict: v.postal_district,
    isAvailable: v.is_available, lastActiveAt: v.last_active_at,
    createdAt: v.created_at, updatedAt: v.updated_at,
  };
}

// ─── Mock data (fallback when tables don't exist yet) ──────────────────────────

const MOCK_COMMUNITIES = [
  {
    id: 'co-001',
    name: 'Singapore Red Cross — Jurong Chapter',
    shortName: 'SRC Jurong',
    type: 'ngo',
    description: 'Providing first aid, disaster relief, and community support across Jurong planning area. Rapid-deployment capacity within 30 minutes.',
    contactPerson: 'Mrs Priya Nair',
    contactPhone: '+65 6336 0269',
    contactEmail: 'jurong@redcross.org.sg',
    address: 'Jurong West Sports Centre, 20 Jurong West St 93, S649070',
    skillAreas: ['first_aid', 'cpr', 'medical_support', 'psychological_support'],
    totalMembers: 48,
    availableMembers: 32,
    deployedMembers: 8,
    activeTasks: 2,
    status: 'active',
    certifications: ['SCDF Endorsed', 'MOH Accredited'],
    coverageAreas: ['Jurong West', 'Clementi', 'Bukit Batok'],
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'co-002',
    name: "People's Association — Jurong West Volunteers",
    shortName: 'PA JW Volunteers',
    type: 'grassroots',
    description: 'Community volunteers from Jurong West RC network. Strong in logistics, food distribution, and resident-liaison during evacuations.',
    contactPerson: 'Mdm Helen Chong',
    contactPhone: '+65 6560 1234',
    contactEmail: 'jwcc@pa.gov.sg',
    address: 'Jurong West Community Club, 20 Jurong West St 61, S648882',
    skillAreas: ['logistics', 'transport', 'translation', 'community_outreach'],
    totalMembers: 120,
    availableMembers: 85,
    deployedMembers: 12,
    activeTasks: 1,
    status: 'active',
    certifications: ['PA Accredited', 'CDC Partner'],
    coverageAreas: ['Jurong West', 'Bukit Batok', 'Bukit Panjang'],
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'co-003',
    name: 'St John Ambulance Brigade — Jurong Unit',
    shortName: 'SJAB Jurong',
    type: 'healthcare',
    description: 'Trained first aiders and ambulance volunteers providing pre-hospital care and community health support. All members hold BCLS/AED certification.',
    contactPerson: 'Mr Lee Wei Liang',
    contactPhone: '+65 6336 5000',
    contactEmail: 'jurong@sjab.org.sg',
    address: 'c/o Jurong East MRT Station, Jurong East Central 1',
    skillAreas: ['first_aid', 'cpr', 'medical_support', 'vehicle'],
    totalMembers: 35,
    availableMembers: 22,
    deployedMembers: 6,
    activeTasks: 1,
    status: 'deployed',
    certifications: ['SJAB Certified', 'MOH Endorsed', 'BCLS/AED Licensed'],
    coverageAreas: ['Jurong East', 'Jurong West', 'Clementi'],
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'co-004',
    name: 'SCDF Community Emergency Response Team — Buona Vista',
    shortName: 'CERT Buona Vista',
    type: 'government',
    description: 'SCDF-trained community first responders. Capable of immediate disaster response before professional services arrive. Trained in urban search & rescue.',
    contactPerson: 'Mr Ahmad Fadzil bin Rahmat',
    contactPhone: '+65 6800 0000',
    contactEmail: 'cert.buonavista@scdf.gov.sg',
    address: 'Buona Vista Fire Station, 51 Buona Vista Rd, S278941',
    skillAreas: ['first_aid', 'cpr', 'heavy_lifting', 'search_rescue'],
    totalMembers: 25,
    availableMembers: 18,
    deployedMembers: 0,
    activeTasks: 0,
    status: 'standby',
    certifications: ['SCDF CERT Certified', 'Urban Search & Rescue'],
    coverageAreas: ['Clementi', 'Buona Vista', 'Dover', 'Queenstown'],
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'co-005',
    name: 'Methodist Welfare Services — Jurong West',
    shortName: 'MWS Jurong',
    type: 'religious',
    description: 'Welfare support, food distribution, elderly care, and counselling during community emergencies. Strong grassroots network in Jurong West.',
    contactPerson: 'Rev James Tan',
    contactPhone: '+65 6252 5528',
    contactEmail: 'jurong@mws.org.sg',
    address: 'Jurong West St 24 Methodist Church, S648362',
    skillAreas: ['psychological_support', 'food_distribution', 'translation'],
    totalMembers: 80,
    availableMembers: 55,
    deployedMembers: 3,
    activeTasks: 0,
    status: 'active',
    certifications: ['IPC Charity', 'NCSS Member'],
    coverageAreas: ['Jurong West', 'Bukit Batok'],
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'co-006',
    name: 'DHL Express Singapore — Corporate Volunteers',
    shortName: 'DHL Volunteers',
    type: 'corporate',
    description: 'Corporate volunteer programme. Fleet of 50+ vehicles available for supply distribution. Specialises in logistics coordination during major emergencies.',
    contactPerson: 'Ms Sarah Lim',
    contactPhone: '+65 6880 8888',
    contactEmail: 'volunteer@dhl.com.sg',
    address: 'DHL Hub Singapore, 1 Aviation Park, S498784',
    skillAreas: ['logistics', 'vehicle', 'heavy_lifting', 'transport'],
    totalMembers: 200,
    availableMembers: 45,
    deployedMembers: 0,
    activeTasks: 0,
    status: 'standby',
    certifications: ['Corporate Volunteer Partner', 'PA-Registered'],
    coverageAreas: ['Island-wide'],
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'co-007',
    name: 'Tampines North Community Club — CARE Network',
    shortName: 'TN CC CARE',
    type: 'grassroots',
    description: 'Community Action & Response (CARE) network focusing on resident welfare, elderly assistance, and community resilience in Tampines North.',
    contactPerson: 'Mr Ravi Kumar',
    contactPhone: '+65 6782 1234',
    contactEmail: 'tncc.care@pa.gov.sg',
    address: 'Tampines North CC, 800 Tampines Ave 4, S520800',
    skillAreas: ['community_outreach', 'translation', 'logistics', 'psychological_support'],
    totalMembers: 95,
    availableMembers: 60,
    deployedMembers: 0,
    activeTasks: 0,
    status: 'active',
    certifications: ['PA Accredited', 'CDC Partner'],
    coverageAreas: ['Tampines', 'Pasir Ris', 'Punggol'],
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const MOCK_VOLUNTEER_TASKS: any[] = [
  {
    id: 'vt-001',
    title: 'Flood Relief — Emergency Food Packing',
    description: 'Pack emergency ration kits for displaced residents at Jurong West evacuation centre. No prior experience needed — supervisors will guide you.',
    organization: 'Singapore Red Cross',
    orgType: 'ngo',
    taskType: 'food_distribution',
    location: 'Jurong West Sports Centre, 20 Jurong West St 93',
    date: 'Today',
    timeSlot: '10:00 AM – 2:00 PM',
    slotsTotal: 30,
    slotsFilled: 18,
    skillsRequired: ['Physical fitness'],
    urgency: 'high',
    status: 'filling',
    incidentId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vt-002',
    title: 'Evacuation Centre — Registration Desk',
    description: 'Assist SCDF staff with registering and tracking displaced evacuees. Laptop provided. Must be comfortable with basic data entry.',
    organization: 'SCDF Community Resilience',
    orgType: 'government',
    taskType: 'shelter_assistance',
    location: 'Clementi Community Club, 3151 Commonwealth Ave W',
    date: 'Today',
    timeSlot: '12:00 PM – 8:00 PM',
    slotsTotal: 10,
    slotsFilled: 4,
    skillsRequired: ['Data entry', 'Patient communication'],
    urgency: 'critical',
    status: 'open',
    incidentId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vt-003',
    title: 'Language Support — Mandarin / Tamil / Malay',
    description: 'Provide real-time translation for elderly residents at evacuation centres and first aid posts.',
    organization: "People's Association",
    orgType: 'government',
    taskType: 'translation',
    location: 'Multiple sites (Jurong West & Clementi)',
    date: 'Today',
    timeSlot: 'Flexible — on call from 9 AM',
    slotsTotal: 8,
    slotsFilled: 3,
    skillsRequired: ['Mandarin', 'Tamil', 'Malay'],
    urgency: 'high',
    status: 'open',
    incidentId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vt-004',
    title: 'First Aid Station Support',
    description: 'Support SGH medical staff at temporary first aid posts. Valid first aid certification (SSFA or equivalent) is required.',
    organization: 'Singapore General Hospital',
    orgType: 'healthcare',
    taskType: 'medical_support',
    location: 'Jurong West Sports Centre — Medical Post B',
    date: 'Today',
    timeSlot: '8:00 AM – 8:00 PM (4-hour shifts)',
    slotsTotal: 15,
    slotsFilled: 12,
    skillsRequired: ['Valid First Aid Cert (SSFA / BCLS)'],
    urgency: 'critical',
    status: 'filling',
    incidentId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vt-005',
    title: 'Emergency Supply Distribution',
    description: 'Help sort and distribute water, blankets, and hygiene kits to affected HDB blocks. Pair up in teams of two.',
    organization: 'Singapore Civil Defence Force',
    orgType: 'government',
    taskType: 'logistics',
    location: 'Bukit Batok Community Centre',
    date: 'Tomorrow',
    timeSlot: '9:00 AM – 5:00 PM',
    slotsTotal: 20,
    slotsFilled: 7,
    skillsRequired: ['Physical fitness', 'Driving licence (optional)'],
    urgency: 'medium',
    status: 'open',
    incidentId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vt-006',
    title: 'Blood Donation Drive — Walk-in',
    description: 'Blood stocks at SGH are critically low. All blood types needed urgently.',
    organization: 'Health Sciences Authority',
    orgType: 'healthcare',
    taskType: 'blood_donation',
    location: 'HSA Bloodbank @ HSA, 11 Outram Rd',
    date: 'Today & Tomorrow',
    timeSlot: '8:30 AM – 4:30 PM',
    slotsTotal: 200,
    slotsFilled: 143,
    skillsRequired: ['Age 16–60', 'Weight ≥ 45 kg', 'Good health'],
    urgency: 'high',
    status: 'filling',
    incidentId: null,
    createdAt: new Date().toISOString(),
  },
];

// In-memory store for new tasks/signups (persists until server restart)
const runtimeTasks: any[] = [];
const runtimeSignups: Map<string, any[]> = new Map();

// ─── Hospitals ─────────────────────────────────────────────────────────────────

router.get('/hospitals', requireAuth, asyncHandler(async (req, res) => {
  const result = await query({
    text: 'SELECT * FROM hospitals ORDER BY name',
    values: [],
  });
  res.json({ hospitals: result.rows.map(toHospital) });
}));

router.patch('/hospitals/:id', requireAuth, requireRole('supervisor', 'gov_admin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { availableBeds, icuAvailable, traumaBays } = req.body;

    const result = await query({
      text: `UPDATE hospitals
             SET available_beds  = COALESCE($1, available_beds),
                 icu_available   = COALESCE($2, icu_available),
                 trauma_bays     = COALESCE($3, trauma_bays),
                 last_updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
      values: [availableBeds, icuAvailable, traumaBays, id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hospital not found' } });
      return;
    }

    res.json(toHospital(result.rows[0]));
  })
);

// ─── Volunteers (legacy — kept for backward compatibility) ─────────────────────

router.get('/volunteers', requireAuth, asyncHandler(async (req, res) => {
  const { skill, available } = req.query;
  const values: any[] = [];
  const conditions: string[] = [];

  let text = 'SELECT * FROM volunteers';

  if (skill) {
    values.push(skill);
    conditions.push(`$${values.length} = ANY(skills)`);
  }
  if (available === 'true') {
    conditions.push('is_available = true');
  }
  if (conditions.length) text += ' WHERE ' + conditions.join(' AND ');
  text += ' ORDER BY full_name';

  const result = await query({ text, values });
  res.json({ volunteers: result.rows.map(toVolunteer) });
}));

// ─── Community Organisations ───────────────────────────────────────────────────

router.get('/communities', requireAuth, asyncHandler(async (req, res) => {
  try {
    const result = await query({
      text: `SELECT * FROM community_organizations ORDER BY name`,
      values: [],
    });

    if (result.rows.length === 0) {
      // Table exists but empty — return mock
      res.json({ communities: MOCK_COMMUNITIES });
      return;
    }

    res.json({
      communities: result.rows.map((c: any) => ({
        id: c.id, name: c.name, shortName: c.short_name,
        type: c.type, description: c.description,
        contactPerson: c.contact_person, contactPhone: c.contact_phone,
        contactEmail: c.contact_email, address: c.address,
        skillAreas: c.skill_areas || [],
        totalMembers: c.total_members, availableMembers: c.available_members,
        deployedMembers: c.deployed_members, activeTasks: c.active_tasks,
        status: c.status, certifications: c.certifications || [],
        coverageAreas: c.coverage_areas || [],
        isVerified: c.is_verified,
        createdAt: c.created_at, updatedAt: c.updated_at,
      })),
    });
  } catch {
    // Table doesn't exist yet — return mock data
    res.json({ communities: MOCK_COMMUNITIES });
  }
}));

// POST /communities/:id/request-aid
// Supervisors/gov create a volunteer task on behalf of a community org
router.post('/communities/:id/request-aid',
  requireAuth, requireRole('responder', 'supervisor', 'gov_admin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id: communityId } = req.params;
    const {
      title, description, taskType, location,
      date, timeSlot, slotsTotal, skillsRequired, urgency,
      incidentId,
    } = req.body;

    // Find community (DB or mock)
    let community: any;
    try {
      const r = await query({
        text: 'SELECT * FROM community_organizations WHERE id = $1',
        values: [communityId],
      });
      community = r.rows[0];
    } catch {
      community = MOCK_COMMUNITIES.find(c => c.id === communityId);
    }

    if (!community) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Community organisation not found' } });
      return;
    }

    const newTask = {
      id: `vt-${crypto.randomUUID().slice(0, 8)}`,
      title: title || `Volunteer Aid Request — ${community.name}`,
      description: description || '',
      organization: community.name || community.shortName,
      orgType: community.type,
      taskType: taskType || 'community_outreach',
      location: location || community.address,
      date: date || 'Today',
      timeSlot: timeSlot || 'To be confirmed',
      slotsTotal: slotsTotal || 20,
      slotsFilled: 0,
      skillsRequired: skillsRequired || [],
      urgency: urgency || 'medium',
      status: 'open',
      incidentId: incidentId || null,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
    };

    // Try DB insert
    try {
      await query({
        text: `INSERT INTO volunteer_tasks
               (id, title, description, organization, org_type, task_type, location,
                task_date, time_slot, slots_total, slots_filled, skills_required,
                urgency, status, incident_id, created_by)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        values: [
          newTask.id, newTask.title, newTask.description, newTask.organization,
          newTask.orgType, newTask.taskType, newTask.location,
          newTask.date, newTask.timeSlot, newTask.slotsTotal, 0,
          newTask.skillsRequired, newTask.urgency, 'open',
          newTask.incidentId, newTask.createdBy,
        ],
      });
    } catch {
      // Table doesn't exist yet — save in memory
      runtimeTasks.unshift(newTask);
    }

    res.status(201).json({ task: newTask, message: 'Volunteer aid request posted successfully' });
  })
);

// ─── Volunteer Tasks ───────────────────────────────────────────────────────────

router.get('/volunteer-tasks', asyncHandler(async (req, res) => {
  try {
    const result = await query({
      text: `SELECT * FROM volunteer_tasks WHERE status != 'completed' ORDER BY created_at DESC`,
      values: [],
    });

    const dbTasks = result.rows.map((t: any) => ({
      id: t.id, title: t.title, description: t.description,
      organization: t.organization, orgType: t.org_type,
      taskType: t.task_type, location: t.location,
      date: t.task_date, timeSlot: t.time_slot,
      slotsTotal: t.slots_total, slotsFilled: t.slots_filled,
      skillsRequired: t.skills_required || [],
      urgency: t.urgency, status: t.status,
      incidentId: t.incident_id,
      createdAt: t.created_at,
    }));

    // Merge DB tasks with runtime tasks (deduped)
    const dbIds = new Set(dbTasks.map((t: any) => t.id));
    const extra = runtimeTasks.filter(t => !dbIds.has(t.id));

    res.json({ tasks: [...extra, ...dbTasks, ...MOCK_VOLUNTEER_TASKS] });
  } catch {
    // Table doesn't exist yet — return mock + runtime tasks
    res.json({ tasks: [...runtimeTasks, ...MOCK_VOLUNTEER_TASKS] });
  }
}));

// POST /volunteer-tasks — supervisor/gov can post tasks directly
router.post('/volunteer-tasks',
  requireAuth, requireRole('supervisor', 'gov_admin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      title, description, organization, orgType, taskType,
      location, date, timeSlot, slotsTotal, skillsRequired, urgency, incidentId,
    } = req.body;

    if (!title || !taskType || !location) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'title, taskType, and location are required' } });
      return;
    }

    const newTask = {
      id: `vt-${crypto.randomUUID().slice(0, 8)}`,
      title, description: description || '',
      organization: organization || 'QuickAid Operations',
      orgType: orgType || 'government',
      taskType, location,
      date: date || 'Today',
      timeSlot: timeSlot || 'To be confirmed',
      slotsTotal: slotsTotal || 20,
      slotsFilled: 0,
      skillsRequired: skillsRequired || [],
      urgency: urgency || 'medium',
      status: 'open',
      incidentId: incidentId || null,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
    };

    try {
      await query({
        text: `INSERT INTO volunteer_tasks
               (id, title, description, organization, org_type, task_type, location,
                task_date, time_slot, slots_total, slots_filled, skills_required,
                urgency, status, incident_id, created_by)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        values: [
          newTask.id, newTask.title, newTask.description, newTask.organization,
          newTask.orgType, newTask.taskType, newTask.location,
          newTask.date, newTask.timeSlot, newTask.slotsTotal, 0,
          newTask.skillsRequired, newTask.urgency, 'open',
          newTask.incidentId, newTask.createdBy,
        ],
      });
    } catch {
      runtimeTasks.unshift(newTask);
    }

    res.status(201).json({ task: newTask });
  })
);

// POST /volunteer-tasks/:id/signup — public
router.post('/volunteer-tasks/:id/signup', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, nric } = req.body;

  if (!fullName || !phone) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'fullName and phone are required' } });
    return;
  }

  const confirmationCode = `QA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const signup = { id: crypto.randomUUID(), taskId: id, fullName, phone, nric, confirmationCode, createdAt: new Date().toISOString() };

  // Try DB
  try {
    await query({
      text: `INSERT INTO volunteer_task_signups (id, task_id, full_name, phone, nric, confirmation_code)
             VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [signup.id, id, fullName, phone, nric, confirmationCode],
    });
    await query({
      text: `UPDATE volunteer_tasks SET slots_filled = slots_filled + 1 WHERE id = $1`,
      values: [id],
    });
  } catch {
    // In-memory fallback
    const existing = runtimeSignups.get(id) || [];
    runtimeSignups.set(id, [...existing, signup]);
    // Also increment in runtime tasks
    const task = runtimeTasks.find(t => t.id === id);
    if (task) task.slotsFilled = Math.min(task.slotsFilled + 1, task.slotsTotal);
  }

  res.status(201).json({
    message: 'Registration successful',
    confirmationCode,
  });
}));

export default router;