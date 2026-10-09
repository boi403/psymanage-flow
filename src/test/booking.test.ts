import { describe, it, expect } from "vitest";
import { bookingContactSchema, buildAvailability } from "@/lib/booking";

describe("Online booking", () => {
  const input = { date: "2030-10-09", from: "08:00", to: "10:00", duration: "50", gap: "10", modality: "online" };
  it("publishes only complete appointments within the professional's open period", () => {
    const slots = buildAvailability(input, 0);
    expect(slots).toHaveLength(2);
    expect(new Date(slots[1].starts_at).getTime() - new Date(slots[0].starts_at).getTime()).toBe(60 * 60_000);
    expect(slots[0].duration_min).toBe(50);
  });
  it("rejects past availability", () => {
    expect(() => buildAvailability(input, new Date("2031-01-01").getTime())).toThrow();
  });
  it("rejects zero duration and negative intervals", () => {
    expect(() => buildAvailability({ ...input, duration: "0" }, 0)).toThrow();
    expect(() => buildAvailability({ ...input, gap: "-1" }, 0)).toThrow();
  });
  it("requires patient name and valid contact before confirmation", () => {
    expect(bookingContactSchema.safeParse({ name: "Ana Silva", phone: "(11) 99999-9999", email: "" }).success).toBe(true);
    expect(bookingContactSchema.safeParse({ name: "", phone: "123", email: "" }).success).toBe(false);
    expect(bookingContactSchema.safeParse({ name: "Ana", phone: "11999999999", email: "inválido" }).success).toBe(false);
  });
});