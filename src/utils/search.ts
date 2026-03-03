export interface SearchOptions {
  query: string;
  fields: string[];
  fuzzy?: boolean;
}

/**
 * Build a PostgreSQL full-text search query.
 * Uses ts_vector for efficient text searching across multiple columns.
 */
export function buildSearchQuery(
  tableName: string,
  options: SearchOptions
): { sql: string; params: string[] } {
  const { query, fields, fuzzy = false } = options;

  if (!query.trim()) {
    return { sql: "1=1", params: [] };
  }

  // Sanitize and prepare search terms
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => t.replace(/[^a-zA-Z0-9]/g, ""));

  if (terms.length === 0) {
    return { sql: "1=1", params: [] };
  }

  if (fuzzy) {
    // Use ILIKE for fuzzy matching across fields
    const conditions = fields.flatMap((field) =>
      terms.map((_, i) => `${tableName}.${field} ILIKE $${i + 1}`)
    );
    return {
      sql: `(${conditions.join(" OR ")})`,
      params: terms.map((t) => `%${t}%`),
    };
  }

  // Use to_tsvector for full-text search
  const vectorExpr = fields
    .map((f) => `coalesce(${tableName}.${f}, '')`)
    .join(" || ' ' || ");
  const tsQuery = terms.join(" & ");

  return {
    sql: `to_tsvector('english', ${vectorExpr}) @@ to_tsquery('english', $1)`,
    params: [tsQuery],
  };
}

/**
 * Highlight matching terms in search results.
 */
export function highlightMatches(text: string, query: string): string {
  if (!query.trim() || !text) return text;

  const terms = query.split(/\s+/).filter((t) => t.length > 0);
  let result = text;

  for (const term of terms) {
    const regex = new RegExp(`(${term})`, "gi");
    result = result.replace(regex, "**$1**");
  }

  return result;
}