import { describe, it, expect } from "vitest";
import { buildSearchQuery, highlightMatches } from "../src/utils/search";

describe("buildSearchQuery", () => {
  it("returns trivial condition for empty query", () => {
    const result = buildSearchQuery("tasks", { query: "", fields: ["title"] });
    expect(result.sql).toBe("1=1");
    expect(result.params).toHaveLength(0);
  });

  it("builds fuzzy ILIKE query", () => {
    const result = buildSearchQuery("tasks", {
      query: "login bug",
      fields: ["title", "description"],
      fuzzy: true,
    });
    expect(result.sql).toContain("ILIKE");
    expect(result.params).toEqual(["%login%", "%bug%"]);
  });

  it("builds full-text search query", () => {
    const result = buildSearchQuery("tasks", {
      query: "authentication error",
      fields: ["title"],
      fuzzy: false,
    });
    expect(result.sql).toContain("to_tsvector");
    expect(result.sql).toContain("to_tsquery");
  });

  it("sanitizes special characters in terms", () => {
    const result = buildSearchQuery("tasks", {
      query: "test; DROP TABLE--",
      fields: ["title"],
      fuzzy: true,
    });
    // Special chars should be stripped
    expect(result.params[0]).not.toContain(";");
    expect(result.params[0]).not.toContain("--");
  });
});

describe("highlightMatches", () => {
  it("wraps matching terms in bold markers", () => {
    const result = highlightMatches("Fix login bug in auth module", "login auth");
    expect(result).toContain("**login**");
    expect(result).toContain("**auth**");
  });

  it("returns original text for empty query", () => {
    const result = highlightMatches("Some text", "");
    expect(result).toBe("Some text");
  });

  it("is case-insensitive", () => {
    const result = highlightMatches("Fix LOGIN issue", "login");
    expect(result).toContain("**LOGIN**");
  });
});