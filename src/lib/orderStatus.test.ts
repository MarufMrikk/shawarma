import { describe, expect, it } from "vitest";
import { allowedTransitions, canTransition, nextStatus, TERMINAL_STATUSES } from "./orderStatus";

describe("order status transitions", () => {
  it("follows the happy path new → accepted → cooking → ready → picked_up", () => {
    expect(nextStatus("new")).toBe("accepted");
    expect(nextStatus("accepted")).toBe("cooking");
    expect(nextStatus("cooking")).toBe("ready");
    expect(nextStatus("ready")).toBe("picked_up");
    expect(nextStatus("picked_up")).toBeNull();
  });

  it("allows cancelling any non-terminal order", () => {
    for (const s of ["new", "accepted", "cooking", "ready"] as const) {
      expect(canTransition(s, "cancelled")).toBe(true);
    }
  });

  it("forbids leaving terminal statuses", () => {
    for (const s of TERMINAL_STATUSES) {
      expect(allowedTransitions(s)).toEqual([]);
      expect(nextStatus(s)).toBeNull();
    }
    expect(canTransition("cancelled", "new")).toBe(false);
    expect(canTransition("picked_up", "ready")).toBe(false);
  });

  it("forbids skipping and going backwards", () => {
    expect(canTransition("new", "cooking")).toBe(false);
    expect(canTransition("new", "picked_up")).toBe(false);
    expect(canTransition("accepted", "ready")).toBe(false);
    expect(canTransition("ready", "cooking")).toBe(false);
    expect(canTransition("cooking", "new")).toBe(false);
  });

  it("forbids staying in the same status", () => {
    expect(canTransition("new", "new")).toBe(false);
    expect(canTransition("ready", "ready")).toBe(false);
  });
});
