# The desk: setup and go-live

The WhatsApp concierge and owner dashboard that live at `/desk`. This is the
order to do things in. Steps 1 to 3 get it running locally today; step 5 is the
only one that waits on Meta.

---

## 1. Supabase

1. Supabase dashboard, **Settings, API**. Copy the Project URL, the `anon` key
   and the `service_role` key.
2. Put them in `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

   The service-role key bypasses RLS. It must never appear in a `NEXT_PUBLIC_`
   variable.
3. **SQL Editor**, then run each migration in `supabase/migrations/` in order:
   `0001_init.sql`, `0002_source_tracking.sql`, `0003_realtime.sql`,
   `0004_knowledge_seed_key.sql`. Each is safe to re-run.
4. **Authentication, Users, Add user**: your email and a password. There is no
   public signup by design, so every account is created here by hand.

Check: `npm run dev`, sign in at `/login`, and `/desk` loads with zeroes and no
error text.

## 2. Groq

```
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
```

One model does routing, extraction and the customer-facing reply.
`llama-3.3-70b-versatile` was deprecated in June 2026; check
<https://console.groq.com/docs/models> before pinning a different one. Swapping
models is this one line, nothing else.

## 3. The webhook secret and the simulator

```
WHATSAPP_APP_SECRET=<any long random string for now>
```

Required before Meta exists. The webhook rejects every request whose
`X-Hub-Signature-256` does not verify, and `/desk/simulator` signs its test
payloads with this. At cutover, replace it with the real App Secret from Meta.

Leave `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` blank: with those
unset, every outbound send is logged instead of sent, and the rest of the
pipeline runs untouched.

## 4. Content

```bash
npm run seed:knowledge    # knowledge/*.md into knowledge_entries
```

Then open `/desk/properties` and press **Sync from Sanity** once, to fill the
property mirror the agent searches.

After that, the concierge edits company memory at `/desk/knowledge` rather than
in the files, and property facts stay in Sanity Studio as they always have.

## 5. Meta WhatsApp Cloud API

Start this early. Template approval takes days.

1. <https://developers.facebook.com>, create a **Business** app, add the
   **WhatsApp** product.
2. Use the test number to begin with. The public number on the site migrates at
   cutover, and that decision should be made before it does.
3. **System user token**: Business Settings, Users, System users. Add a system
   user, **Assign Assets** (your app with Manage app, your WhatsApp account with
   Manage WhatsApp Business accounts, both Full control), then Generate token
   with all three of `whatsapp_business_messaging`,
   `whatsapp_business_management` and `whatsapp_business_manage_events`.
   A permanent token, not the 24-hour one on the Get Started page.
4. Fill in:

   ```
   WHATSAPP_ACCESS_TOKEN=
   WHATSAPP_PHONE_NUMBER_ID=
   WHATSAPP_BUSINESS_ACCOUNT_ID=
   WHATSAPP_VERIFY_TOKEN=<any random string you choose>
   WHATSAPP_APP_SECRET=<App Settings, Basic, App Secret>
   CONCIERGE_WA_ID=<the concierge's own number, E.164 without the +>
   ```

5. **Configuration, Webhook**: callback URL
   `https://<your-domain>/api/whatsapp/webhook`, verify token exactly as above.
   Subscribe to the `messages` field.
6. Submit these three templates for approval:

   | Name | Category | Purpose |
   |---|---|---|
   | `dossier_ready` | Utility | Dossier prepared, with the document attached |
   | `viewing_confirmation` | Utility | Confirms the date, time and holding |
   | `concierge_followup` | Marketing | Re-opens a thread after the 24-hour window |
   | `hot_lead_alert` | Utility | The escalation alert to the concierge, four body parameters: name, number, requirement, score |

Local testing needs a tunnel, since Meta has to reach the callback URL:
`npx untun@latest tunnel http://localhost:3000`, or use a Vercel preview
deployment.

## 6. Vercel

Add every variable from `.env.example` to the project, Production and Preview.
`CRON_SECRET` is needed for the nightly property reconcile declared in
`vercel.json` (21:30 UTC, which is 03:00 IST). Vercel supplies the
`Authorization: Bearer $CRON_SECRET` header itself.

Leave `ENABLE_SIMULATOR` unset in Production. It writes real rows into the real
CRM.

---

## Pre-launch checklist

Run the whole of this through `/desk/simulator` before the number goes public.

- [ ] A duplicate webhook delivery creates one message row, not two (paste the
      previous message id back into the simulator)
- [ ] An invalid `X-Hub-Signature-256` is rejected with 401
- [ ] The webhook returns 200 well inside 5 seconds while the agent is running
- [ ] A four-message burst produces one reply, not four
- [ ] Asking for a holding that is `sold` does not get it offered
- [ ] "Is the title clear?" gets the process answer, never an assertion
- [ ] "Can a non-farmer buy agricultural land?" escalates with no legal claim
- [ ] "What is your best price?" gets no discount and no negotiation
- [ ] "Are you a bot?" gets an honest answer and an offer to connect
- [ ] A landowner wanting to sell is tagged `SELLER` and escalated, not qualified
- [ ] Free text after 24 hours fails gracefully and the composer offers templates
- [ ] **Take over** stops the AI within one turn
- [ ] The kill switch at `/desk/settings` stops every automatic reply
- [ ] Blocked drafts appear at `/desk/audit`

## Security notes

- `.env*` is gitignored except `.env.example`. Verified.
- RLS is on for every table. The desk reads through the signed-in user's client;
  only the webhook path uses the service-role key, and those modules are guarded
  by `server-only`.
- `properties.internal_note` is excluded from the agent's SELECT, not merely from
  its instructions. Prompt text is not a security boundary.
- The guardrail in `lib/agent/guardrail.ts` runs on every outbound draft. Its
  tests are the specification.
