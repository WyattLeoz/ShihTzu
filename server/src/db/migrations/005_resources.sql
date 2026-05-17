-- 005_resources.sql
CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  total_beds INTEGER NOT NULL,
  available_beds INTEGER NOT NULL,
  icu_available INTEGER NOT NULL,
  trauma_bays INTEGER NOT NULL,
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  postal_district TEXT,
  is_available BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);