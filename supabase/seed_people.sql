-- Placeholder team roster (swap for Michael's real people on roster receipt).
-- Fixed UUIDs for James (VB) + Rica (EA) so tests can reference them.
insert into people (id, name, role, company_id, type, contact_classification, communication_profile, relationship_health, last_contact_at, contact_frequency_target, sentiment_trend) values
  ('11111111-1111-1111-1111-111111111111','James Lim','GM, Venture Builder','vb','core_team','internal_team','{"tone":"casual","formality_level":4,"preferred_channel":"chat"}',95, now(), 'weekly','positive'),
  ('22222222-2222-2222-2222-222222222222','Rica Santos','EA / Chief of Staff',null,'core_team','internal_team','{"tone":"direct","formality_level":5,"preferred_channel":"chat"}',99, now(), 'daily','positive'),
  (gen_random_uuid(),'David Cruz','CTO, ISP','isp','core_team','internal_team','{"tone":"technical","formality_level":6}',68, now() - interval '8 day','weekly','watch'),
  (gen_random_uuid(),'Ana Reyes','COO, BioTech','bio','core_team','internal_team','{"tone":"formal","formality_level":8}',92, now() - interval '2 day','weekly','positive'),
  (gen_random_uuid(),'Marco Tan','Director, MP1','mp1','core_team','internal_team','{"tone":"casual","formality_level":4}',74, now() - interval '5 day','weekly','watch'),
  (gen_random_uuid(),'Sarah Valdez','Director, MP2','mp2','core_team','internal_team','{"tone":"casual","formality_level":5}',45, now() - interval '14 day','weekly','negative'),
  (gen_random_uuid(),'Elena Torres','Head, Bright Lights','ngo','core_team','internal_team','{"tone":"warm","formality_level":3}',88, now() - interval '3 day','biweekly','positive'),
  (gen_random_uuid(),'Kevin Park','CFO, Group',null,'core_team','internal_team','{"tone":"precise","formality_level":7}',90, now() - interval '1 day','weekly','positive')
on conflict (id) do nothing;
