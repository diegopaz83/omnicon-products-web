const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

// Set PUBLIC_BUILD=true to drop every internal page and read no project.json
export const isPublicBuild = process.env.PUBLIC_BUILD === 'true';

// Prefix a site-relative path with the deploy base
export function url(path = ''): string {
  return `${base}/${path.replace(/^\/+/, '')}`;
}
