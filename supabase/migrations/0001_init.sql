-- Josh Properties desk: WhatsApp concierge + owner dashboard.
-- Merges spec.md section 2 with the memory doc section A2. No `vector`
-- extension: at ~15 knowledge entries, trigram + keyword retrieval is the
-- whole feature.
-- ponytail: revisit embeddings past ~150 entries, not before.

create extension if not exists pg_trgm;

-- Shared updated_at trigger, so no write path has to remember.
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

-- ============ CUSTOMERS ============
create table customers (
  id              uuid primary key default gen_random_uuid(),
  wa_id           text unique not null,        -- E.164 without '+', from Meta
  display_name    text,                        -- WhatsApp profile name
  full_name       text,                        -- name the bot asked for
  email           text,
  is_nri          boolean default false,
  country_hint    text,
  preferred_lang  text default 'en',           -- en | te | hi
  first_seen_at   timestamptz default now(),
  last_seen_at    timestamptz default now(),
  blocked         boolean default false
);

-- ============ CONVERSATIONS ============
create table conversations (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid references customers(id) on delete cascade,
  status              text default 'open',      -- open | handed_off | closed
  ai_enabled          boolean default true,     -- flipped off by human takeover
  assigned_to         uuid references auth.users(id),
  last_inbound_at     timestamptz,              -- drives the 24h window
  last_outbound_at    timestamptz,
  unread_for_owner    boolean default true,
  summary             text,                     -- rolling, once thread > 20 messages
  created_at          timestamptz default now()
);
create index on conversations (status, last_inbound_at desc);
create index on conversations (customer_id);

-- ============ MESSAGES ============
create table messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid references conversations(id) on delete cascade,
  wa_message_id    text unique,                 -- Meta id, for idempotency
  direction        text not null,               -- inbound | outbound
  sender           text not null,               -- customer | ai | human
  msg_type         text default 'text',         -- text|audio|image|document|template|interactive
  body             text,
  media_url        text,
  transcript       text,                        -- for voice notes
  template_name    text,
  status           text,                        -- sent|delivered|read|failed
  error_detail     jsonb,
  created_at       timestamptz default now()
);
create index on messages (conversation_id, created_at);

-- Circular by nature: the summary points at the last message it covers.
alter table conversations
  add column summary_upto_message_id uuid references messages(id);

-- ============ PROPERTIES (mirror of Sanity) ============
-- Union of two Sanity doc types: `property` and `farmlandOption`. The live
-- farmland holdings are farmlandOption docs, not property docs.
create table properties (
  id               uuid primary key default gen_random_uuid(),
  sanity_id        text unique not null,
  sanity_type      text not null,               -- property | farmlandOption
  folio            text,                        -- '020', or 'FL-2' for farmland
  slug             text,
  name             text not null,
  asset_class      text not null,               -- villa | apartment | farmland
  locality         text,
  -- Sanity prices are display strings and some are ranges
  -- ('49-52 Lakhs'). price_inr is the low/only figure and is what search
  -- filters on; price_max_inr is null unless the listing quotes a range.
  -- Both must be treated as quotable by the guardrail's invented-price check.
  price_inr        bigint,
  price_max_inr    bigint,
  price_display    text,                        -- the Sanity string, verbatim
  negotiable       boolean default false,       -- '(Negotiable)' vs '(Fixed)'
  area_display     text,                        -- the Sanity string, verbatim
  area_value       numeric,                     -- low end when a range
  area_unit        text,                        -- sqft | acres | sqyds
  uds_sqyds        numeric,
  bhk              int,
  status           text default 'available',    -- available|limited|under_offer|reserved|sold|coming_soon
  holding_note     text,                        -- '2 plots left, Phase 1'
  public_summary   text,                        -- safe for the bot to quote
  url              text,
  hero_image_url   text,
  synced_at        timestamptz default now(),

  -- Owner-editable, Supabase-only. The sync must NEVER overwrite these two.
  bot_visible      boolean default true,
  internal_note    text
);
create index on properties (asset_class, status) where bot_visible;

-- ============ LEADS ============
create table leads (
  id                   uuid primary key default gen_random_uuid(),
  customer_id          uuid references customers(id) on delete cascade,
  conversation_id      uuid references conversations(id),
  intent               text,                    -- buy | sell | rent | invest | unknown
  asset_class          text,
  locality             text,
  budget_min           bigint,
  budget_max           bigint,
  budget_band          text,                    -- under_1cr|1_3cr|3_6cr|6cr_plus|unsure
  timeline_months      int,
  purpose              text,                    -- enduse|investment|farmhouse|nri_parking
  property_of_interest uuid references properties(id),
  dossier_requested    boolean default false,
  dossier_sent_at      timestamptz,
  call_booked_at       timestamptz,
  viewing_requested    boolean default false,
  score                int default 0,
  temperature          text default 'COLD',     -- HOT | WARM | COLD
  tags                 text[] default '{}',     -- NRI, SELLER, BROKER, REPEAT, WAITLIST, PRICE_FISHING
  stage                text default 'new',      -- new|qualifying|call_booked|viewing|title|offer|closed|lost
  owner_notified_at    timestamptz,             -- drives the 6h escalation debounce
  next_action          text,
  next_action_due      date,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);
create index on leads (temperature, created_at desc);
create index on leads (stage);
create index on leads (customer_id);
create trigger leads_touch before update on leads
  for each row execute function touch_updated_at();

-- ============ VIEWINGS ============
create table viewings (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references leads(id) on delete cascade,
  property_id   uuid references properties(id),
  kind          text,                            -- call | site_visit | drone_pass | video_call
  scheduled_at  timestamptz,
  status        text default 'proposed',         -- proposed|confirmed|done|no_show|cancelled
  notes         text,
  created_at    timestamptz default now()
);
create index on viewings (scheduled_at);

-- ============ COMPANY MEMORY ============
create table knowledge_entries (
  id            uuid primary key default gen_random_uuid(),
  category      text not null,        -- company|faq|policy|process|pricing|area|objection|legal_boundary
  title         text not null,
  content       text not null,
  keywords      text[] default '{}',

  scope         text default 'global',   -- global | asset_class | locality | property
  scope_value   text,                    -- 'farmland' | 'Shankarpally' | folio '020'

  priority      int default 100,      -- higher wins on conflict; 900+ = always injected
  pinned        boolean default false,

  effective_from date default current_date,
  expires_at     date,                -- anything time-bound: phase availability, offers
  active         boolean default true,

  source        text default 'manual', -- manual|whatsapp|correction|gap_fill|import
  version       int default 1,
  supersedes    uuid references knowledge_entries(id),
  created_by    uuid references auth.users(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index on knowledge_entries using gin (keywords);
create index on knowledge_entries using gin (content gin_trgm_ops);
create index on knowledge_entries (category, active);
create index on knowledge_entries (scope, scope_value) where active;
create trigger knowledge_touch before update on knowledge_entries
  for each row execute function touch_updated_at();

-- ============ CUSTOMER MEMORY ============
create table customer_memory (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid references customers(id) on delete cascade,
  key               text not null,   -- budget_band|locality|financing|objection|nri_country...
  value             text not null,
  confidence        numeric default 1.0,
  source_message_id uuid references messages(id) on delete set null,
  updated_at        timestamptz default now(),
  unique (customer_id, key)
);
create trigger customer_memory_touch before update on customer_memory
  for each row execute function touch_updated_at();

-- ============ SETTINGS ============
create table agent_settings (
  id                  int primary key default 1,
  business_name       text default 'Josh Properties',
  tone_instructions   text,
  greeting_en         text,
  after_hours_note    text,
  escalation_wa_id    text,
  escalation_email    text,
  hot_threshold       int default 75,
  warm_threshold      int default 45,
  ai_globally_enabled boolean default true,      -- the kill switch
  updated_at          timestamptz default now(),
  constraint agent_settings_singleton check (id = 1)
);
insert into agent_settings (id) values (1);
create trigger agent_settings_touch before update on agent_settings
  for each row execute function touch_updated_at();

-- ============ AUDIT ============
-- Written from day one; its dashboard page is deferred.
create table audit_log (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete set null,
  event           text,        -- ai_reply|guardrail_block|takeover|score_change|escalation|sync
  detail          jsonb,
  actor           text,
  created_at      timestamptz default now()
);
create index on audit_log (event, created_at desc);
create index on audit_log (conversation_id, created_at desc);

-- ============ CACHE BUSTING ============
-- Any knowledge edit bumps the version; the assembled prompt block is cached
-- on it, so an owner edit propagates on the next request with no stale reads.
create table system_state (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default now()
);
insert into system_state (key, value) values ('knowledge_version', '1')
  on conflict do nothing;

create or replace function bump_knowledge_version() returns trigger as $$
begin
  update system_state
     set value = (value::int + 1)::text, updated_at = now()
   where key = 'knowledge_version';
  return null;
end $$ language plpgsql;

create trigger kb_bump
after insert or update or delete on knowledge_entries
for each statement execute function bump_knowledge_version();

-- ============ RLS ============
-- There is no public signup: every auth.users row is desk staff. So the policy
-- is "signed in", not per-row ownership. The webhook path writes with the
-- service-role key, which bypasses RLS entirely. `anon` gets no policy at all,
-- which means no access.
-- ponytail: per-user row ownership if the firm ever adds non-staff logins.
do $$
declare t text;
begin
  foreach t in array array[
    'customers','conversations','messages','properties','leads','viewings',
    'knowledge_entries','customer_memory','agent_settings','audit_log','system_state'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy desk_staff on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
