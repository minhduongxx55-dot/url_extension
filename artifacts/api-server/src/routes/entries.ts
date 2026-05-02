import { Router } from "express";
import { eq, or, ilike, sql } from "drizzle-orm";
import { db, entriesTable } from "@workspace/db";
import {
  ListEntriesQueryParams,
  SearchEntryQueryParams,
  CreateEntryBody,
  UpdateEntryBody,
  UpdateEntryParams,
  DeleteEntryParams,
  GetEntryParams,
  ValidateAndAddEntryBody,
} from "@workspace/api-zod";

const router = Router();

// GET /entries/search — must come before /entries/:id to avoid conflict
router.get("/entries/search", async (req, res): Promise<void> => {
  const parsed = SearchEntryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { keyword, code } = parsed.data;

  if (!keyword && !code) {
    res.status(400).json({ error: "Provide at least keyword or code" });
    return;
  }

  const conditions = [];
  if (keyword) conditions.push(ilike(entriesTable.keyword, `%${keyword}%`));
  if (code) conditions.push(ilike(entriesTable.code, `%${code}%`));

  const results = await db
    .select()
    .from(entriesTable)
    .where(or(...conditions))
    .limit(1);

  if (results.length === 0) {
    res.status(404).json({ error: "No matching entry found" });
    return;
  }

  res.json({ entry: results[0], source: "cache" });
});

// POST /entries/validate-and-add
router.post("/entries/validate-and-add", async (req, res): Promise<void> => {
  const parsed = ValidateAndAddEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const raw = parsed.data;
  // Normalize URL: ensure it has https:// prefix
  const url = /^https?:\/\//i.test(raw.url.trim())
    ? raw.url.trim()
    : `https://${raw.url.trim()}`;
  const keyword = raw.keyword;
  const code = raw.code;

  // Check if already exists (match both with and without https:// prefix)
  const existing = await db
    .select()
    .from(entriesTable)
    .where(or(ilike(entriesTable.url, url), ilike(entriesTable.url, url.replace(/^https?:\/\//i, ""))))
    .limit(1);

  if (existing.length > 0) {
    res.status(200).json(existing[0]);
    return;
  }

  // Validate URL accessibility
  let isValid = false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const response = await fetch(url, {
      signal: ctrl.signal,
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
        "Accept-Language": "vi-VN,vi;q=0.9",
      },
    });
    clearTimeout(timer);
    isValid = response.ok || response.status < 500;
  } catch {
    isValid = false;
  }

  if (!isValid) {
    // Try with GET if HEAD failed
    try {
      const ctrl2 = new AbortController();
      const timer2 = setTimeout(() => ctrl2.abort(), 10000);
      const response2 = await fetch(url, {
        signal: ctrl2.signal,
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
          "Accept-Language": "vi-VN,vi;q=0.9",
        },
      });
      clearTimeout(timer2);
      isValid = response2.ok || response2.status < 500;
    } catch {
      isValid = false;
    }
  }

  if (!isValid) {
    res
      .status(422)
      .json({ error: `URL ${url} is not accessible. Not stored.` });
    return;
  }

  const [inserted] = await db
    .insert(entriesTable)
    .values({
      url,
      keyword: keyword ?? null,
      code: code ?? null,
      isValid: true,
    })
    .returning();

  res.status(201).json(inserted);
});

// GET /entries
router.get("/entries", async (req, res): Promise<void> => {
  const parsed = ListEntriesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { search } = parsed.data;

  let rows;
  if (search) {
    rows = await db
      .select()
      .from(entriesTable)
      .where(
        or(
          ilike(entriesTable.keyword, `%${search}%`),
          ilike(entriesTable.code, `%${search}%`),
          ilike(entriesTable.url, `%${search}%`)
        )
      )
      .orderBy(sql`${entriesTable.createdAt} DESC`);
  } else {
    rows = await db
      .select()
      .from(entriesTable)
      .orderBy(sql`${entriesTable.createdAt} DESC`);
  }

  res.json(rows);
});

// POST /entries
router.post("/entries", async (req, res): Promise<void> => {
  const parsed = CreateEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { url, keyword, code, isValid } = parsed.data;

  const [inserted] = await db
    .insert(entriesTable)
    .values({
      url,
      keyword: keyword ?? null,
      code: code ?? null,
      isValid: isValid ?? true,
    })
    .returning();

  res.status(201).json(inserted);
});

// GET /entries/:id
router.get("/entries/:id", async (req, res): Promise<void> => {
  const parsed = GetEntryParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select()
    .from(entriesTable)
    .where(eq(entriesTable.id, parsed.data.id));

  if (!row) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json(row);
});

// PUT /entries/:id
router.put("/entries/:id", async (req, res): Promise<void> => {
  const paramsParsed = UpdateEntryParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = UpdateEntryBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const existing = await db
    .select()
    .from(entriesTable)
    .where(eq(entriesTable.id, paramsParsed.data.id));

  if (existing.length === 0) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  const updates: Partial<typeof entriesTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (bodyParsed.data.url !== undefined) updates.url = bodyParsed.data.url;
  if (bodyParsed.data.keyword !== undefined)
    updates.keyword = bodyParsed.data.keyword;
  if (bodyParsed.data.code !== undefined) updates.code = bodyParsed.data.code;
  if (bodyParsed.data.isValid !== undefined)
    updates.isValid = bodyParsed.data.isValid;

  const [updated] = await db
    .update(entriesTable)
    .set(updates)
    .where(eq(entriesTable.id, paramsParsed.data.id))
    .returning();

  res.json(updated);
});

// DELETE /entries/:id
router.delete("/entries/:id", async (req, res): Promise<void> => {
  const parsed = DeleteEntryParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const existing = await db
    .select()
    .from(entriesTable)
    .where(eq(entriesTable.id, parsed.data.id));

  if (existing.length === 0) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  await db.delete(entriesTable).where(eq(entriesTable.id, parsed.data.id));

  res.json({ success: true });
});

export default router;
