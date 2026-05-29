const PATTERNS: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^\/article\/([^/]+)\/?$/, (m) => `/archive/article/${m[1]}`],
  [/^\/nippo\/([^/]+)\/?$/, (m) => `/archive/nippo/${m[1]}`],
];

export function mapOldUrl(pathname: string): string | null {
  for (const [re, build] of PATTERNS) {
    const m = pathname.match(re);
    if (m) return build(m);
  }
  return null;
}
