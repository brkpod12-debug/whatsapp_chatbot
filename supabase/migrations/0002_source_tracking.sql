-- Marketing attribution. The website's WhatsApp CTAs and any click-to-WhatsApp
-- ad carry context that Meta hands over exactly once, on the first message of a
-- conversation (`referral`). It is unrecoverable if not written down then, so
-- the ingest path stores it before anything else looks at the message.
--
-- Kept out of 0001 so a database that already ran 0001 can take this on its own.

alter table conversations add column if not exists referral jsonb;

-- Denormalised onto both rows the dashboard actually groups by, so "leads by
-- source" is one index scan rather than a join back through conversations.
alter table customers add column if not exists source text;   -- whatsapp|website|instagram|google_ads|referral
alter table leads     add column if not exists source text;
alter table leads     add column if not exists campaign text;

create index if not exists leads_source_idx on leads (source, created_at desc);
create index if not exists customers_source_idx on customers (source);

-- The desk's "needs reply" view asks for threads where the customer spoke last.
-- Without this it is a sequential scan over every conversation on every load.
create index if not exists conversations_unread_idx
  on conversations (unread_for_owner, last_inbound_at desc);
