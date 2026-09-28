import { deskClient } from "@/lib/desk/supabase";
import { BotVisibleToggle, InternalNote, SyncButton } from "./PropertyControls";

export const dynamic = "force-dynamic";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export default async function PropertiesPage() {
  const supabase = await deskClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      "id, folio, name, asset_class, locality, price_display, price_inr, area_display, bhk, status, holding_note, bot_visible, internal_note, synced_at, url"
    )
    .order("asset_class")
    .order("folio", { nullsFirst: false });

  const lastSync = (properties ?? []).reduce<string | null>((latest, p) => {
    const at = p.synced_at as string | null;
    return at && (!latest || at > latest) ? at : latest;
  }, null);

  return (
    <div className="px-6 py-10">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="font-display text-4xl">Holdings</h1>
          <p className="mt-1 text-sm text-slate">
            Sourced from Sanity. Edit property facts in Studio, not here.
            {lastSync ? ` Last synced ${new Date(lastSync).toLocaleString()}.` : " Never synced."}
          </p>
        </div>
        <div className="ml-auto">
          <SyncButton />
        </div>
      </div>

      {error ? <p className="mt-6 text-sm text-wax">{error.message}</p> : null}

      <div className="mt-8 space-y-4">
        {(properties ?? []).map((p) => (
          <article
            key={p.id as string}
            className="border border-ink/15 outline outline-1 outline-ink/10 outline-offset-[3px] bg-stone p-5"
          >
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="stamp text-slate">{(p.folio as string) ?? "—"}</span>
              <h2 className="font-display text-2xl">{p.name as string}</h2>
              <span className="stamp text-slate">
                {[p.asset_class, p.locality].filter(Boolean).join(" · ")}
              </span>
              <span className="stamp ml-auto text-champagne">{p.status as string}</span>
              <BotVisibleToggle id={p.id as string} visible={Boolean(p.bot_visible)} />
            </div>

            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
              <div>
                <dt className="stamp text-slate">Price</dt>
                <dd>
                  {(p.price_display as string) ?? "—"}
                  {p.price_inr ? (
                    <span className="ml-2 text-slate">₹{inr.format(p.price_inr as number)}</span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="stamp text-slate">Area</dt>
                <dd>{(p.area_display as string) ?? "—"}</dd>
              </div>
              {p.bhk ? (
                <div>
                  <dt className="stamp text-slate">Config</dt>
                  <dd>{p.bhk as number} BHK</dd>
                </div>
              ) : null}
              {p.holding_note ? (
                <div>
                  <dt className="stamp text-slate">Holding</dt>
                  <dd>{p.holding_note as string}</dd>
                </div>
              ) : null}
            </dl>

            <InternalNote id={p.id as string} note={p.internal_note as string | null} />
          </article>
        ))}

        {(properties ?? []).length === 0 && !error ? (
          <p className="text-sm text-slate">
            The mirror is empty. Press Sync from Sanity to fill it.
          </p>
        ) : null}
      </div>
    </div>
  );
}
