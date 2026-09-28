/**
 * The slice of Meta's webhook envelope this app actually reads. Meta sends a
 * deeply nested `entry[].changes[].value` shape and adds fields freely, so this
 * types what is used and ignores the rest rather than trying to mirror the API.
 */

export type WaProfile = { wa_id: string; profile?: { name?: string } };

export type WaMessage = {
  id: string;
  from: string;
  timestamp?: string;
  type: string;
  text?: { body: string };
  button?: { text?: string; payload?: string };
  interactive?: {
    type?: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
  audio?: { id: string; voice?: boolean };
  image?: { id: string; caption?: string };
  video?: { id: string; caption?: string };
  document?: { id: string; filename?: string; caption?: string };
  location?: { latitude: number; longitude: number; name?: string };
  referral?: { source_type?: string; source_id?: string; headline?: string };
  context?: { id?: string };
};

export type WaStatus = {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  recipient_id?: string;
  errors?: { code?: number; title?: string; message?: string }[];
};

export type WaChangeValue = {
  messaging_product?: string;
  contacts?: WaProfile[];
  messages?: WaMessage[];
  statuses?: WaStatus[];
};

export type WaWebhookBody = {
  object?: string;
  entry?: { id?: string; changes?: { field?: string; value?: WaChangeValue }[] }[];
};

/** Flattens the entry/changes nesting; a single POST can carry several changes. */
export function changeValues(body: WaWebhookBody): WaChangeValue[] {
  return (body.entry ?? []).flatMap((entry) =>
    (entry.changes ?? []).map((change) => change.value).filter((v): v is WaChangeValue => Boolean(v))
  );
}

export type ExtractedMessage = {
  msgType: string;
  body: string | null;
  mediaId: string | null;
};

/**
 * Every inbound type collapses to "what the agent reads" plus an optional media
 * id to fetch later. Button and list replies are stored as their visible title,
 * because that is what the customer believes they said.
 */
export function extractContent(message: WaMessage): ExtractedMessage {
  switch (message.type) {
    case "text":
      return { msgType: "text", body: message.text?.body ?? null, mediaId: null };
    case "button":
      return { msgType: "interactive", body: message.button?.text ?? null, mediaId: null };
    case "interactive": {
      const reply = message.interactive?.button_reply ?? message.interactive?.list_reply;
      return { msgType: "interactive", body: reply?.title ?? null, mediaId: null };
    }
    case "audio":
      // Body stays null until transcription fills `messages.transcript`.
      return { msgType: "audio", body: null, mediaId: message.audio?.id ?? null };
    case "image":
      return { msgType: "image", body: message.image?.caption ?? null, mediaId: message.image?.id ?? null };
    case "video":
      return { msgType: "video", body: message.video?.caption ?? null, mediaId: message.video?.id ?? null };
    case "document":
      return {
        msgType: "document",
        body: message.document?.caption ?? message.document?.filename ?? null,
        mediaId: message.document?.id ?? null,
      };
    case "location": {
      const loc = message.location;
      const label = loc ? (loc.name ?? `${loc.latitude}, ${loc.longitude}`) : null;
      return { msgType: "location", body: label, mediaId: null };
    }
    default:
      return { msgType: message.type || "unknown", body: null, mediaId: null };
  }
}

/**
 * Anything that is not an Indian number is treated as a probable NRI, which the
 * scoring and routing layers care about. A hint, never an assertion: the desk
 * confirms it. Meta gives `wa_id` as E.164 without the '+'.
 */
export function countryHint(waId: string): { countryHint: string | null; isNri: boolean } {
  if (waId.startsWith("91")) return { countryHint: "IN", isNri: false };
  const known: Record<string, string> = {
    "1": "US/CA", "44": "GB", "971": "AE", "966": "SA", "65": "SG",
    "61": "AU", "60": "MY", "974": "QA", "968": "OM", "965": "KW", "64": "NZ",
  };
  const code = Object.keys(known)
    .sort((a, b) => b.length - a.length)
    .find((c) => waId.startsWith(c));
  return { countryHint: code ? known[code] : null, isNri: true };
}
