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
      heroTitle: "Dz0526 / ITO",
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
    avatarUrl: data.avatar?.src,
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
    // Relative path — keep as-is (safe, no protocol injection possible)
    return src;
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
  const { entries, error } = await getEmDashCollection("blogpost");

  if (error) {
    throw new Error(
      `listBlogPosts: failed to fetch blogpost collection: ${
        (error as { message?: string }).message ?? error
      }`,
    );
  }

  const posts: PostSummary[] = (entries ?? [])
    .filter((e) => e.data.published === true)
    .sort((a, b) => {
      // date is a string field — sort lexicographically desc (ISO format works)
      const da = a.data.date ?? "";
      const db = b.data.date ?? "";
      return db.localeCompare(da);
    })
    .map((e) => ({
      title: e.data.title,
      slug: e.data.slug ?? e.data.id,
      date: e.data.date,
      excerpt: e.data.excerpt,
      tags: parseTags(e.data.tags),
    }));

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

  // Only serve published posts
  if (entry.data.published !== true) return null;

  return {
    title: entry.data.title,
    slug: entry.data.slug ?? entry.data.id,
    date: entry.data.date,
    excerpt: entry.data.excerpt,
    tags: parseTags(entry.data.tags),
    body: entry.data.body ?? [],
    coverImageUrl: imageToUrl(entry.data.cover_image),
  };
}
