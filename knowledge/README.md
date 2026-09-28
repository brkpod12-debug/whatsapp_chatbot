# Knowledge base

These files are the **authoring** surface. They are not read at runtime.

`npm run seed:knowledge` parses every `## Heading` in each file into one row in
the `knowledge_entries` table, and the agent retrieves from that table. Editing a
row at `/desk/knowledge` changes what the bot says immediately, with no deploy
and no file edit.

One file per category. Per-section directives go on the lines directly under the
heading, before the body:

```
## What the dossier contains
keywords: dossier, documents, title, survey
priority: 500
scope: asset_class=farmland

Body text the bot may quote, verbatim.
```

- `keywords` sharpen retrieval. Write the words a customer would actually use.
- `priority` defaults to 100. **900 or above is injected into every prompt**, so
  reserve it for a handful of company facts.
- `scope` limits an entry to `asset_class=<villa|apartment|farmland>` or
  `locality=<name>`. Omit for entries that apply everywhere.
- `expires` (`expires: 2026-12-31`) retires anything time-bound. Use it for phase
  availability. A wrong fact stated confidently is worse than no fact.

Never put a price in here that is not also in Sanity: the guardrail blocks any
rupee figure the reply was not handed, and a price kept in two places goes stale
in one of them.
