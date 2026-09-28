import { describe, expect, it } from "vitest";
import { changeValues, countryHint, extractContent, type WaMessage } from "./payload";

const msg = (partial: Partial<WaMessage>): WaMessage =>
  ({ id: "wamid.1", from: "919000000000", type: "text", ...partial }) as WaMessage;

describe("extractContent", () => {
  it("reads plain text", () => {
    expect(extractContent(msg({ type: "text", text: { body: "need land" } }))).toEqual({
      msgType: "text", body: "need land", mediaId: null,
    });
  });

  it("stores a button reply as the title the customer saw", () => {
    const m = msg({ type: "interactive", interactive: { button_reply: { id: "b1", title: "Farmland" } } });
    expect(extractContent(m)).toEqual({ msgType: "interactive", body: "Farmland", mediaId: null });
  });

  it("stores a list reply the same way", () => {
    const m = msg({ type: "interactive", interactive: { list_reply: { id: "l1", title: "3 BHK" } } });
    expect(extractContent(m).body).toBe("3 BHK");
  });

  it("leaves a voice note body null and keeps the media id for transcription", () => {
    expect(extractContent(msg({ type: "audio", audio: { id: "media-9", voice: true } }))).toEqual({
      msgType: "audio", body: null, mediaId: "media-9",
    });
  });

  it("prefers a document caption over its filename", () => {
    const m = msg({ type: "document", document: { id: "d1", filename: "pan.pdf", caption: "my PAN" } });
    expect(extractContent(m).body).toBe("my PAN");
  });

  it("falls back to coordinates when a shared location has no name", () => {
    const m = msg({ type: "location", location: { latitude: 17.4, longitude: 78.4 } });
    expect(extractContent(m).body).toBe("17.4, 78.4");
  });

  it("does not throw on a type it has never seen", () => {
    expect(extractContent(msg({ type: "sticker" }))).toEqual({
      msgType: "sticker", body: null, mediaId: null,
    });
  });
});

describe("countryHint", () => {
  it("treats an Indian number as resident", () => {
    expect(countryHint("919000000000")).toEqual({ countryHint: "IN", isNri: false });
  });

  it("matches the longest country code first, not the shortest", () => {
    // '971' must win over '9', and '1' must not swallow a UAE number.
    expect(countryHint("971500000000")).toEqual({ countryHint: "AE", isNri: true });
  });

  it("flags an unknown foreign number as NRI with no country", () => {
    expect(countryHint("258840000000")).toEqual({ countryHint: null, isNri: true });
  });
});

describe("changeValues", () => {
  it("flattens every change across every entry", () => {
    const values = changeValues({
      entry: [
        { changes: [{ value: { messages: [msg({})] } }, { value: { statuses: [] } }] },
        { changes: [{ value: { contacts: [] } }] },
      ],
    });
    expect(values).toHaveLength(3);
  });

  it("survives an empty envelope", () => {
    expect(changeValues({})).toEqual([]);
    expect(changeValues({ entry: [{}] })).toEqual([]);
  });
});
