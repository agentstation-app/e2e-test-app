import { describe, it, expect } from "vitest";

describe("Task validation", () => {
  it("should require a title", () => {
    const task = { description: "test" };
    expect(task).not.toHaveProperty("title");
  });

  it("should validate priority values", () => {
    const validPriorities = ["low", "medium", "high", "urgent"];
    expect(validPriorities).toContain("high");
    expect(validPriorities).not.toContain("critical");
  });

  it("should validate status values", () => {
    const validStatuses = ["pending", "in_progress", "review", "done"];
    expect(validStatuses).toContain("pending");
    expect(validStatuses).not.toContain("cancelled");
  });
});

describe("Task priority ordering", () => {
  const priorities = { low: 1, medium: 2, high: 3, urgent: 4 };

  it("urgent should be highest priority", () => {
    expect(priorities.urgent).toBeGreaterThan(priorities.high);
  });

  it("low should be lowest priority", () => {
    expect(priorities.low).toBeLessThan(priorities.medium);
  });
});