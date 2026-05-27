import { getEmDashEntry } from "emdash";
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

/**
 * Read the single "profile" entry from the EmDash database.
 * Translates snake_case EmDash fields to camelCase for the rest of the codebase.
 * Returns safe defaults when the database isn't seeded yet so the page renders.
 */
export async function getProfile(): Promise<Profile> {
  const { entry } = await getEmDashEntry("profile", "profile");

  if (!entry) {
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
        typeof (l as Record<string, unknown>).url === "string",
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
