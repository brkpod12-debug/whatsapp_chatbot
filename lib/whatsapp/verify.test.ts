import { describe, expect, it } from "vitest";
import { signBody, verifySignature } from "./verify";

const SECRET = "test-app-secret";
const BODY = '{"object":"whatsapp_business_account","entry":[{"id":"1"}]}';

describe("verifySignature", () => {
  it("accepts a signature it just produced", () => {
    expect(verifySignature(BODY, signBody(BODY, SECRET), SECRET)).toBe(true);
  });

  it("rejects a body that was tampered with after signing", () => {
    const sig = signBody(BODY, SECRET);
    expect(verifySignature(BODY.replace('"1"', '"2"'), sig, SECRET)).toBe(false);
  });

  it("rejects a signature made with a different secret", () => {
    expect(verifySignature(BODY, signBody(BODY, "other"), SECRET)).toBe(false);
  });

  it.each([
    ["missing header", null],
    ["no sha256= prefix", "abc123"],
    ["truncated digest", "sha256=abc123"],
    ["not hex", "sha256=zzzz"],
  ])("rejects %s", (_label, header) => {
    expect(verifySignature(BODY, header, SECRET)).toBe(false);
  });

  it("rejects everything when no app secret is configured", () => {
    expect(verifySignature(BODY, signBody(BODY, SECRET), undefined)).toBe(false);
  });
});
