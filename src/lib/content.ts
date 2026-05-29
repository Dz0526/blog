import { getEmDashEntry, getEmDashCollection } from "emdash";
import type { PortableTextBlock } from "emdash";

export interface ContactLink {
  label: string;
  url: string;
  icon: string;
}

export interface Profile {
  heroTitle: string;
  heroSubtitle?: string;
  bio: PortableTextBlock[];
  avatarUrl?: string;
  contactLinks: ContactLink[];
}

/** Only these URL protocols are allowed in contact_links and cover images to prevent XSS. */
export const ALLOWED_URL_PROTOCOLS = /^(https?:|mailto:)/i;

/**
 * Read the single "profile" entry from the EmDash database.
 * Translates snake_case EmDash fields to camelCase for the rest of the codebase.
 * Returns safe defaults when the database isn't seeded yet so the page renders.
 */
export async function getProfile(): Promise<Profile> {
  const { entry, error } = await getEmDashEntry("profile", "profile");

  if (error) {
    throw new Error(
      `getProfile: failed to fetch profile entry: ${(error as { message?: string }).message ?? error}`,
    );
  }

  if (!entry) {
    // DB is unseeded (local dev before first seed run). Return placeholder
    // so the dev page renders without crashing.
    return {
      heroTitle: "Daiki Ito",
      heroSubtitle: undefined,
      bio: [],
      avatarUrl: undefined,
      contactLinks: [],
    };
  }

  const data = entry.data;

  // contact_links is typed as `unknown` in emdash-env.d.ts because the
  // repeater sub-field shape isn't inferred. Cast and normalise safely.
  const rawLinks = Array.isArray(data.contact_links) ? data.contact_links : [];
  const contactLinks: ContactLink[] = rawLinks
    .filter(
      (l): l is { label: string; url: string; icon?: string } =>
        l !== null &&
        typeof l === "object" &&
        typeof (l as Record<string, unknown>).label === "string" &&
        typeof (l as Record<string, unknown>).url === "string" &&
        ALLOWED_URL_PROTOCOLS.test((l as Record<string, unknown>).url as string),
    )
    .map((l) => ({
      label: l.label,
      url: l.url,
      icon: typeof l.icon === "string" ? l.icon : "",
    }));

  return {
    heroTitle: data.hero_title,
    heroSubtitle: data.hero_subtitle,
    bio: data.bio ?? [],
    avatarUrl: imageToUrl(data.avatar),
    contactLinks,
  };
}

// ---------------------------------------------------------------------------
// BlogPost types and functions
// ---------------------------------------------------------------------------

export interface PostSummary {
  title: string;
  slug: string;
  date: string;
  excerpt?: string;
  tags?: string[];
}

export interface BlogPost extends PostSummary {
  body: unknown; // PortableTextBlock[]; validated at the renderer
  coverImageUrl?: string;
}

/**
 * Split a comma-separated tags string into an array.
 * Returns undefined when the input is empty or not a string.
 */
function parseTags(raw: unknown): string[] | undefined {
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Map an EmDash blogpost entry to a PostSummary.
 * Centralises the five-field mapping shared by listBlogPosts and getBlogPostBySlug.
 * Note: ContentEntry does not expose a top-level `slug`; slug lives in entry.data.
 */
function toPostSummary(entry: {
  id: string;
  data: Record<string, unknown>;
}): PostSummary {
  const d = entry.data;
  return {
    title: String(d.title ?? ""),
    // data.slug is the content slug; fall back to the entry id (ULID)
    slug: String(d.slug ?? entry.id),
    date: String(d.date ?? ""),
    excerpt: typeof d.excerpt === "string" ? d.excerpt : undefined,
    tags: parseTags(d.tags),
  };
}

/**
 * Extract a URL string from an EmDash image field value.
 * The image may provide `src` directly or require building from the media API.
 * Returns undefined when the image is absent or malformed.
 */
function imageToUrl(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const img = raw as Record<string, unknown>;
  // Some providers return a direct URL in `src`
  if (typeof img.src === "string" && img.src) {
    const src = img.src;
    if (ALLOWED_URL_PROTOCOLS.test(src)) return src;
    // Accept root-relative paths only; reject anything else (e.g. javascript:)
    if (src.startsWith("/")) return src;
    return undefined;
  }
  // Local provider: build from media API using the media id
  if (typeof img.id === "string" && img.id) {
    return `/_emdash/api/media/file/${img.id}`;
  }
  return undefined;
}

/**
 * List all published BlogPost entries, sorted by date descending.
 *
 * EmDash listing API: `getEmDashCollection(collectionSlug, options)`
 * from "emdash". Same function used by the scaffold's posts/index.astro.
 */
export async function listBlogPosts(
  opts: { limit?: number } = {},
): Promise<PostSummary[]> {
  // Push limit to the API so the DB can optimise the query.
  // We still slice below as a safety net in case the API returns extras
  // (e.g. due to bucket rounding inside getEmDashCollection).
  const { entries, error } = await getEmDashCollection("blogpost", {
    ...(opts.limit !== undefined && opts.limit > 0 ? { limit: opts.limit } : {}),
  });

  if (error) {
    throw new Error(
      `listBlogPosts: failed to fetch blogpost collection: ${
        (error as { message?: string }).message ?? error
      }`,
    );
  }

  const posts: PostSummary[] = (entries ?? [])
    // EmDash tracks publish state on the entry's top-level `status` column,
    // not on the user-defined `data.published` field. SQLite stores booleans
    // as INTEGER (1/0), so a strict `=== true` check on data.published would
    // exclude every entry. Use `entry.status === "published"` instead.
    .filter((e) => (e as { status?: string }).status === "published")
    .sort((a, b) => {
      // date is a string field — sort lexicographically desc (ISO format works)
      const da = String(a.data.date ?? "");
      const db = String(b.data.date ?? "");
      return db.localeCompare(da);
    })
    .map((e) => toPostSummary(e as unknown as { id: string; data: Record<string, unknown> }));

  // Safety-net slice: honours the requested limit even when the API returns
  // more entries than asked (bucket rounding, status filtering, etc.).
  if (opts.limit != null && opts.limit > 0) {
    return posts.slice(0, opts.limit);
  }
  return posts;
}

/**
 * Fetch a single published BlogPost by its slug.
 *
 * Returns null when the entry does not exist or is not published.
 * Throws when EmDash returns an error.
 */
export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  const { entry, error } = await getEmDashEntry("blogpost", slug);

  if (error) {
    throw new Error(
      `getBlogPostBySlug: failed to fetch blogpost "${slug}": ${
        (error as { message?: string }).message ?? error
      }`,
    );
  }

  // entry is null and error is null → entry not found
  if (!entry) return null;

  // Only serve published posts (see listBlogPosts for the same rationale —
  // EmDash uses entry.status, not data.published).
  if ((entry as { status?: string }).status !== "published") return null;

  return {
    ...toPostSummary(entry as unknown as { id: string; data: Record<string, unknown> }),
    body: entry.data.body ?? [],
    coverImageUrl: imageToUrl(entry.data.cover_image),
  };
}

// ---------------------------------------------------------------------------
// Archive types and functions
// ---------------------------------------------------------------------------

export interface ArchivedArticle {
  title: string;
  slug: string;
  date: string;
  body: unknown; // PortableTextBlock[]; validated at the renderer
}

export interface ArchivedNippo {
  title?: string; // optional — some nippos lack a title
  slug: string;
  date: string;
  body: unknown;
}

export interface ArchiveListItem {
  slug: string;
  date: string;
  title?: string;
}

/**
 * Map an EmDash archivedarticle or archivednippo entry to an ArchiveListItem.
 * Centralises the mapping shared by listArchivedArticles and listArchivedNippos.
 */
function toArchiveListItem(entry: {
  id: string;
  data: Record<string, unknown>;
}): ArchiveListItem {
  const d = entry.data;
  return {
    slug: String(d.slug ?? entry.id),
    date: String(d.date ?? ""),
    title: typeof d.title === "string" && d.title ? d.title : undefined,
  };
}

/**
 * List all ArchivedArticle entries, sorted by date descending.
 */
export async function listArchivedArticles(): Promise<ArchiveListItem[]> {
  const { entries, error } = await getEmDashCollection("archivedarticle");

  if (error) {
    throw new Error(
      `listArchivedArticles: failed to fetch archivedarticle collection: ${
        (error as { message?: string }).message ?? error
      }`,
    );
  }

  return (entries ?? [])
    .map((e) => toArchiveListItem(e as unknown as { id: string; data: Record<string, unknown> }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * List all ArchivedNippo entries, sorted by date descending.
 */
export async function listArchivedNippos(): Promise<ArchiveListItem[]> {
  const { entries, error } = await getEmDashCollection("archivednippo");

  if (error) {
    throw new Error(
      `listArchivedNippos: failed to fetch archivednippo collection: ${
        (error as { message?: string }).message ?? error
      }`,
    );
  }

  return (entries ?? [])
    .map((e) => toArchiveListItem(e as unknown as { id: string; data: Record<string, unknown> }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Fetch a single ArchivedArticle by its slug (original _posts filename without .md).
 *
 * Returns null when the entry does not exist.
 * Throws when EmDash returns an error.
 */
export async function getArchivedArticleBySlug(
  slug: string,
): Promise<ArchivedArticle | null> {
  const { entry, error } = await getEmDashEntry("archivedarticle", slug);

  if (error) {
    throw new Error(
      `getArchivedArticleBySlug: failed to fetch archivedarticle "${slug}": ${
        (error as { message?: string }).message ?? error
      }`,
    );
  }

  if (!entry) return null;

  const d = (entry.data as unknown) as Record<string, unknown>;
  return {
    title: String(d.title ?? ""),
    slug: String(d.slug ?? entry.id),
    date: String(d.date ?? ""),
    body: d.body ?? [],
  };
}

/**
 * Fetch a single ArchivedNippo by its date slug (e.g. "2023-01-06").
 *
 * Returns null when the entry does not exist.
 * Throws when EmDash returns an error.
 */
export async function getArchivedNippoByDate(
  date: string,
): Promise<ArchivedNippo | null> {
  const { entry, error } = await getEmDashEntry("archivednippo", date);

  if (error) {
    throw new Error(
      `getArchivedNippoByDate: failed to fetch archivednippo "${date}": ${
        (error as { message?: string }).message ?? error
      }`,
    );
  }

  if (!entry) return null;

  const d = (entry.data as unknown) as Record<string, unknown>;
  return {
    title: typeof d.title === "string" && d.title ? d.title : undefined,
    slug: String(d.slug ?? entry.id),
    date: String(d.date ?? ""),
    body: d.body ?? [],
  };
}
