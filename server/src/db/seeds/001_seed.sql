-- 001_seed.sql
-- Password hashes for "Demo1234!" (bcrypt rounds=12)

-- Users (4 users, one per role)
INSERT INTO users (id, email, password_hash, full_name, role, unit, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'citizen@demo.sg', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/XewYC5L9yKqMqdOJe', 'Tan Wei Ming', 'citizen', NULL, '+65 8123 4567'),
  ('550e8400-e29b-41d4-a716-446655440002', 'responder@demo.sg', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/XewYC5L9yKqMqdOJe', 'Ahmad Bin Hassan', 'responder', 'SCDF Station 4', '+65 8234 5678'),
  ('550e8400-e29b-41d4-a716-446655440003', 'supervisor@demo.sg', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/XewYC5L9yKqMqdOJe', 'Chen Xiao Ling', 'supervisor', 'MOH Operations', '+65 8345 6789'),
  ('550e8400-e29b-41d4-a716-446655440004', 'admin@demo.sg', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/XewYC5L9yKqMqdOJe', 'Raj Kumar', 'gov_admin', 'Gov Crisis Center', '+65 8456 7890');

-- Hospitals (6 major Singapore hospitals)
INSERT INTO hospitals (name, short_name, address, lat, lng, total_beds, available_beds, icu_available, trauma_bays) VALUES
  ('Singapore General Hospital', 'SGH', 'Outram Rd, Singapore 169608', 1.2801, 103.8352, 1500, 245, 18, 8),
  ('Tan Tock Seng Hospital', 'TTSH', '11 Jalan Tan Tock Seng, Singapore 308433', 1.3201, 103.8452, 1700, 198, 22, 12),
  ('National University Hospital', 'NUH', '5 Lower Kent Ridge Rd, Singapore 119074', 1.2948, 103.7838, 1200, 167, 15, 6),
  ('Changi General Hospital', 'CGH', '2 Simei St 3, Singapore 529889', 1.3451, 103.9577, 1000, 134, 11, 5),
  ('Khoo Teck Puat Hospital', 'KTPH', '90 Yishun Central, Singapore 768828', 1.4293, 103.8341, 800, 112, 9, 4),
  ('Alexandra Hospital', 'AH', '378 Alexandra Rd, Singapore 159964', 1.2932, 103.8035, 330, 89, 6, 3);

-- Incidents (15 realistic incidents across Singapore)
INSERT INTO incidents (id, ticket_number, type, title, description, location_text, location_lat, location_lng, severity, status, reported_by) VALUES
  -- Medical incidents
  ('770e8400-e29b-41d4-a716-446655440001', 'INC-20260517-0001', 'medical', 'Cardiac Arrest at MRT', '62-year-old male collapsed on platform, unresponsive, CPR initiated by bystander. AED on site but patient still unconscious.', 'Bishan MRT Station Platform', 1.3507, 103.8482, 1, 'open', '550e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440002', 'INC-20260517-0002', 'medical', 'Fall from Height at HDB', '78-year-old female fell from 4th floor corridor, conscious but multiple fractures suspected. Multiple casualties in the vicinity.', 'Block 456 Ang Mo Kio Ave 10', 1.3694, 103.8488, 1, 'triaging', '550e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440003', 'INC-20260517-0003', 'medical', 'Mass Food Poisoning at School', '12 students from River Valley Primary School reported severe vomiting and diarrhea after lunch. Suspected contaminated canteen food.', 'River Valley Primary School', 1.2967, 103.8346, 2, 'open', '550e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440004', 'INC-20260517-0004', 'medical', 'Construction Site Injury', 'Worker injured by falling steel beam, severe leg injury, bleeding heavily. 3 other workers trapped nearby.', 'Construction Site at Marina Bay', 1.2816, 103.8604, 1, 'dispatched', '550e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440005', 'INC-20260517-0005', 'medical', 'Allergic Reaction - Multiple', 'Food festival at Clarke Quay, multiple patrons experiencing severe allergic reactions to undisclosed ingredient. At least 6 affected.', 'Clarke Quay Central', 1.2896, 103.8464, 2, 'open', '550e8400-e29b-41d4-a716-446655440001'),

  -- Fire incidents
  ('770e8400-e29b-41d4-a716-446655440006', 'INC-20260517-0006', 'fire', 'HDB Flat Fire', 'Fire reported on 12th floor, unit burning, smoke visible. 2 elderly residents may be trapped inside. Fire spreading to adjacent units.', 'Block 128 Tampines St 11', 1.3536, 103.9431, 1, 'on_scene', '550e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440007', 'INC-20260517-0007', 'fire', 'Factory Fire at Jurong', 'Chemical factory fire with potential toxic smoke plume. Workers evacuated but some may still be in danger zone. Fire not contained.', 'Jurong Industrial Area, Pioneer Rd', 1.3298, 103.7042, 1, 'open', '550e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440008', 'INC-20260517-0008', 'fire', 'Vehicle Fire on Highway', 'Tanker truck caught fire on ECP, spreading to multiple vehicles. Significant traffic congestion. Driver trapped in cabin.', 'East Coast Parkway towards Changi', 1.3089, 103.9352, 1, 'dispatched', '550e8400-e29b-41d4-a716-446655440001'),

  -- Flood incidents
  ('770e8400-e29b-41d4-a716-446655440009', 'INC-20260517-0009', 'flood', 'Flash Flood at Orchard', 'Heavy rainfall causing flash flood along Orchard Road. Multiple vehicles stalled, pedestrians stranded. Water level rising rapidly.', 'Orchard Road near Lucky Plaza', 1.3045, 103.8321, 2, 'open', '550e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440010', 'INC-20260517-0010', 'flood', 'Drain Overflow in Residential Area', 'Monsoon drain overflowed at Bukit Batok, flooding low-lying apartments. Elderly residents unable to evacuate.', 'Bukit Batok Street 31', 1.3494, 103.7502, 2, 'resolved', '550e8400-e29b-41d4-a716-446655440001'),

  -- Road incidents
  ('770e8400-e29b-41d4-a716-446655440011', 'INC-20260517-0011', 'road', 'Multi-Vehicle Collision', '5-car pileup at PIE junction, 3 casualties with serious injuries, 2 trapped. Significant debris blocking all lanes.', 'PIE near Buona Vista', 1.3079, 103.7902, 1, 'triaging', '550e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440012', 'INC-20260517-0012', 'road', 'Bus vs Pedestrian', 'SMRT bus collided with pedestrian at crossing. Pedestrian critical, multiple passengers with minor injuries from sudden braking.', 'Bus stop along Upper Thomson Rd', 1.3512, 103.8318, 1, 'dispatched', '550e8400-e29b-41d4-a716-446655440001'),

  -- Infrastructure incidents
  ('770e8400-e29b-41d4-a716-446655440013', 'INC-20260517-0013', 'infrastructure', 'MRT Track Fault', 'Power failure on North-South Line between Bishan and Toa Payoh. Train stranded with 800 passengers onboard. Smoke detected in tunnel.', 'Underground tunnel near Braddell', 1.3358, 103.8401, 1, 'open', '550e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440014', 'INC-20260517-0014', 'infrastructure', 'Power Outage in Central Area', 'Widespread power outage affecting CBD, including hospitals and emergency services. Multiple elevators stuck with occupants.', 'Singapore CBD area', 1.2838, 103.8431, 2, 'on_scene', '550e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440015', 'INC-20260517-0015', 'civil', 'Crowd Control at Stadium', 'Overcrowding at National Stadium during concert. Gate crush situation, multiple injuries reported. Risk of stampede.', 'Singapore Sports Hub', 1.3326, 103.8736, 2, 'resolved', '550e8400-e29b-41d4-a716-446655440001');

-- Volunteers (20 volunteers with diverse skills)
INSERT INTO volunteers (id, user_id, full_name, phone, skills, postal_district, is_available) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', NULL, 'Lim Mei Hui', '+65 9001 1234', '{first_aid,cpr}', '01', true),
  ('880e8400-e29b-41d4-a716-446655440002', NULL, 'Mohd Farid', '+65 9002 2345', '{first_aid,vehicle}', '02', true),
  ('880e8400-e29b-41d4-a716-446655440003', NULL, 'Siti Aminah', '+65 9003 3456', '{cpr,medical_support}', '03', true),
  ('880e8400-e29b-41d4-a716-446655440004', NULL, 'David Tan', '+65 9004 4567', '{first_aid,transport,translation}', '04', true),
  ('880e8400-e29b-41d4-a716-446655440005', NULL, 'Grace Lee', '+65 9005 5678', '{cpr,psychological_support}', '05', true),
  ('880e8400-e29b-41d4-a716-446655440006', NULL, 'Rajesh Kumar', '+65 9006 6789', '{first_aid,heavy_lifting}', '06', true),
  ('880e8400-e29b-41d4-a716-446655440007', NULL, 'Chen Wei', '+65 9007 7890', '{medical_support,cpr}', '07', true),
  ('880e8400-e29b-41d4-a716-446655440008', NULL, 'Amanda Ng', '+65 9008 8901', '{first_aid,translation,psychological_support}', '08', true),
  ('880e8400-e29b-41d4-a716-446655440009', NULL, 'John Smith', '+65 9009 9012', '{vehicle,first_aid}', '09', true),
  ('880e8400-e29b-41d4-a716-446655440010', NULL, 'Fatimah Binte', '+65 9010 0123', '{cpr,medical_support,translation}', '10', true),
  ('880e8400-e29b-41d4-a716-446655440011', NULL, 'Kevin Wong', '+65 9011 1234', '{first_aid,heavy_lifting}', '11', true),
  ('880e8400-e29b-41d4-a716-446655440012', NULL, 'Sarah Johnson', '+65 9012 2345', '{psychological_support,translation}', '12', true),
  ('880e8400-e29b-41d4-a716-446655440013', NULL, 'Zulkifli Ali', '+65 9013 3456', '{vehicle,first_aid,transport}', '13', true),
  ('880e8400-e29b-41d4-a716-446655440014', NULL, 'Patricia Tan', '+65 9014 4567', '{cpr,first_aid,medical_support}', '14', true),
  ('880e8400-e29b-41d4-a716-446655440015', NULL, 'Michael Lim', '+65 9015 5678', '{first_aid,psychological_support}', '15', true),
  ('880e8400-e29b-41d4-a716-446655440016', NULL, 'Linda Chen', '+65 9016 6789', '{translation,medical_support}', '16', true),
  ('880e8400-e29b-41d4-a716-446655440017', NULL, 'Robert Singh', '+65 9017 7890', '{vehicle,heavy_lifting}', '17', true),
  ('880e8400-e29b-41d4-a716-446655440018', NULL, 'Emily Yap', '+65 9018 8901', '{cpr,first_aid,psychological_support}', '18', true),
  ('880e8400-e29b-41d4-a716-446655440019', NULL, 'James Ng', '+65 9019 9012', '{transport,first_aid}', '19', true),
  ('880e8400-e29b-41d4-a716-446655440020', NULL, 'Helen Lim', '+65 9020 0123', '{cpr,medical_support,translation}', '20', true);

-- Broadcasts (5 sample broadcasts)
INSERT INTO broadcasts (id, title, message, audience, zone, sent_by, incident_id) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', 'Flood Alert - Orchard Area', 'Heavy rainfall causing flash floods. Avoid low-lying areas. Seek higher ground if water levels rise.', 'zone', 'Central', '550e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440009'),
  ('990e8400-e29b-41d4-a716-446655440002', 'All Responders - Standby', 'Multiple incidents reported across CBD. All units on standby for immediate deployment.', 'responders', NULL, '550e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440014'),
  ('990e8400-e29b-41d4-a716-446655440003', 'Public Safety Advisory', 'Construction site accident at Marina Bay. Avoid the area. Emergency services are on scene.', 'all', NULL, '550e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440004'),
  ('990e8400-e29b-41d4-a716-446655440004', 'MRT Disruption Notice', 'Power failure on North-South Line. Alternative bus services deployed. Check SMRT app for updates.', 'all', NULL, '550e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440013'),
  ('990e8400-e29b-41d4-a716-446655440005', 'Volunteer Call - Medical Support', 'Multiple medical incidents requiring first aid support. All available first-aid certified volunteers please report to nearest SCDF station.', 'responders', NULL, '550e8400-e29b-41d4-a716-446655440003', NULL);

-- Incident updates (timeline entries for sample incidents)
INSERT INTO incident_updates (incident_id, author_id, update_type, content, metadata) VALUES
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'status_change', 'Incident status changed to dispatched', '{"previous_status":"open"}'),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'dispatch', 'Ambulance dispatched to construction site. ETA 8 minutes.', '{"unit":"SCDF Station 4"}'),
  ('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'status_change', 'Incident status changed to on_scene', '{"previous_status":"dispatched"}'),
  ('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'note', 'Firefighters on scene, attacking blaze from multiple angles.', NULL),
  ('770e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'status_change', 'Incident status changed to resolved', '{"previous_status":"on_scene"}'),
  ('770e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'notification', 'All affected residents evacuated safely. Drain cleanup in progress.', NULL),
  ('770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'status_change', 'Incident status changed to resolved', '{"previous_status":"on_scene"}'),
  ('770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'notification', 'Crowd dispersing peacefully. Medical team treated 12 minor injuries.', NULL);