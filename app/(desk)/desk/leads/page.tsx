import Link from "next/link";
import { listLeads, STAGES, type LeadFilters } from "@/lib/desk/leads";

export const dynamic = "force-dynamic";

const TEMPERATURES = ["HOT", "WARM", "COLD"] as const;
const ASSET_CLASSES = ["villa", "apartment", "farmland"] as const;
const TAGS = ["NRI", "SELLER", "BROKER", "REPEAT", "PRICE_FISHING", "OUT_OF_AREA"] as const;

const TEMP_TONE: Record<string, string> = {
  HOT: "text-wax",
  WARM: "text-champagne",
  COLD: "text-slate",
};

function query(current: LeadFilters, patch: Partial<LeadFilters>): string {
  const merged = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

function FilterRow({
  label,
  options,
  active,
  filters,
  param,
}: {
  label: string;
  options: readonly string[];
  active: string | undefined;
  filters: LeadFilters;
  param: keyof LeadFilters;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <span className="stamp w-20 shrink-0 text-slate">{label}</span>
      <Link
        href={`/desk/leads${query(filters, { [param]: undefined })}`}
        className={`stamp ${active ? "text-slate hover:text-ink" : "text-ink"}`}
      >
        All
      </Link>
      {options.map((option) => (
        <Link
          key={option}
          href={`/desk/leads${query(filters, { [param]: option })}`}
          className={`stamp ${active === option ? "text-ink" : "text-slate hover:text-ink"}`}
        >
          {option.replace(/_/g, " ")}
        </Link>
      ))}
    </div>
  );
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters: LeadFilters = {
    temperature: params.temperature,
    stage: params.stage,
    assetClass: params.assetClass,
    tag: params.tag,
    q: params.q,
  };

  const leads = await listLeads(filters);

  return (
    <div className="px-6 py-10">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="font-display text-4xl">Leads</h1>
          <p className="mt-1 text-sm text-slate">
            {leads.length} in view. Scored by the desk, never by the model.
          </p>
        </div>
        <a
          href={`/desk/leads/export${query(filters, {})}`}
          className="ml-auto border border-ink/15 px-4 py-2 text-sm hover:border-champagne"
        >
          Export CSV
        </a>
      </div>

      <form method="get" className="mt-6 flex gap-3">
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search name, number or locality"
          className="w-72 border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-champagne"
        />
        {/* Keep the active chips when searching. */}
        {(["temperature", "stage", "assetClass", "tag"] as const).map((key) =>
          filters[key] ? <input key={key} type="hidden" name={key} value={filters[key]} /> : null
        )}
        <button type="submit" className="bg-ink px-4 py-2 text-sm text-paper">
          Search
        </button>
      </form>

      <div className="mt-6 space-y-2 border-y border-line py-4">
        <FilterRow label="Temperature" options={TEMPERATURES} active={filters.temperature} filters={filters} param="temperature" />
        <FilterRow label="Stage" options={STAGES} active={filters.stage} filters={filters} param="stage" />
        <FilterRow label="Asset" options={ASSET_CLASSES} active={filters.assetClass} filters={filters} param="assetClass" />
        <FilterRow label="Tag" options={TAGS} active={filters.tag} filters={filters} param="tag" />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["Name", "Requirement", "Budget", "Timeline", "Score", "Stage", "Source", "Updated"].map(
                (h) => (
                  <th key={h} className="stamp py-2 pr-4 font-normal text-slate">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-line hover:bg-stone">
                <td className="py-2.5 pr-4">
                  <Link href={`/desk/leads/${lead.id}`} className="hover:text-champagne">
                    {lead.name}
                  </Link>
                  <span className="stamp ml-2 text-slate">+{lead.waId}</span>
                </td>
                <td className="py-2.5 pr-4 text-slate">
                  {[lead.assetClass, lead.locality].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="py-2.5 pr-4 text-slate">
                  {lead.budgetBand?.replace(/_/g, " ") ?? "—"}
                </td>
                <td className="py-2.5 pr-4 text-slate">
                  {lead.timelineMonths ? `${lead.timelineMonths} mo` : "—"}
                </td>
                <td className="py-2.5 pr-4 tabular-nums">
                  {lead.score}
                  <span className={`stamp ml-2 ${TEMP_TONE[lead.temperature]}`}>
                    {lead.temperature}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-slate">{lead.stage.replace(/_/g, " ")}</td>
                <td className="py-2.5 pr-4 text-slate">{lead.source ?? "—"}</td>
                <td className="stamp py-2.5 pr-4 text-slate">
                  {new Date(lead.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leads.length === 0 ? (
          <p className="py-8 text-sm text-slate">
            No leads match. Clear a filter, or send yourself a message from the simulator.
          </p>
        ) : null}
      </div>
    </div>
  );
}
