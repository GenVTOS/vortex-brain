-- ─────────────────────────────────────────────────────────────────────────
-- seed.sql — initial reference data.
-- NOTE: companies/people below are PLACEHOLDERS matching the prototype so the UI
-- is coherent on first run. Replace with Michael's real roster (open-questions.md
-- §1) and set each person's app_metadata role/company in Supabase Auth.
-- ─────────────────────────────────────────────────────────────────────────

insert into companies (id, name, icon) values
  ('vb',  'Venture Builder',  '🏗'),
  ('isp', 'ISP Company',      '📡'),
  ('bio', 'BioTech',          '🧬'),
  ('mp1', 'Manpower Co. 1',   '👥'),
  ('mp2', 'Manpower Co. 2',   '👥'),
  ('ngo', 'Bright Lights LC', '💡')
on conflict (id) do nothing;

-- Wisdom council (system_prompt populated in Phase 4).
insert into wisdom_experts (id, name, domain, color) values
  ('bezos',   'Jeff Bezos',     'Infrastructure, long-term', '#B8A0D2'),
  ('buffett', 'Warren Buffett', 'Capital allocation',        '#B8A0D2'),
  ('thiel',   'Peter Thiel',    'Contrarian, monopoly',      '#B8A0D2'),
  ('hormozi', 'Alex Hormozi',   'Scaling services',          '#B8A0D2'),
  ('grove',   'Andy Grove',     'Operations, OKRs',          '#B8A0D2'),
  ('munger',  'Charlie Munger', 'Mental models',             '#B8A0D2'),
  ('dalio',   'Ray Dalio',      'Principles, systems',       '#B8A0D2'),
  ('sy',      'Henry Sy',       'PH conglomerate',           '#B8A0D2')
on conflict (id) do nothing;

-- Default observer blocklist (banking + sensitive — PH-focused).
insert into observer_blocklist (domain, label, is_auto_detected) values
  ('bpi.com.ph',       'BPI Online Banking', true),
  ('unionbankph.com',  'UnionBank',          true),
  ('metrobank.com.ph', 'Metrobank',          true),
  ('gcash.com',        'GCash',              true),
  ('maya.ph',          'Maya / PayMaya',     true),
  ('1password.com',    '1Password Vault',    true)
on conflict (domain) do nothing;

-- Emergency thresholds.
insert into emergency_config (type, threshold_description, threshold_value, action) values
  ('financial',    'Exposure above ₱500K without approval', '{"amount": 500000}', 'wake_michael'),
  ('legal',        'Communication from lawyer or court',     '{}',                 'wake_michael'),
  ('safety',       'Physical safety mention detected',        '{}',                 'wake_michael'),
  ('relationship', 'Wife health score below 50%',            '{"threshold": 50}',  'wake_michael');

-- Reading profile (single row; "Catching Thunder" taste).
insert into reading_profile (favorite_books) values
  ('[{"title":"Catching Thunder","author":"Eskil Engdal","why":"world''s longest sea chase"}]'::jsonb);
