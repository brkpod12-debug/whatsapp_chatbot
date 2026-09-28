-- `npm run seed:knowledge` re-runs whenever the authoring files change, so it
-- needs a stable key to upsert on. Category plus title is the natural one, and
-- two entries with the same title in the same category were a mistake anyway.
--
-- Partial, on active rows only: a superseded entry keeps its title in history.
create unique index if not exists knowledge_entries_category_title_key
  on knowledge_entries (category, title)
  where active;
