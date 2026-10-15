import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { isPublicBuild } from './paths';
import {
  ProductSchema,
  ProjectSchema,
  SiteSchema,
  type Product,
  type Project,
  type Site,
} from './schema';

// Build and dev run from the project root
const CONTENT_DIR = resolve(process.cwd(), 'content');

// Read a content file and fail with its path when it breaks the schema
function readJson<T extends z.ZodType>(file: string, schema: T): z.output<T> {
  const result = schema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
  if (!result.success) {
    throw new Error(`Invalid content ${file}\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export function getSite(): Site {
  return readJson(resolve(CONTENT_DIR, 'site.json'), SiteSchema);
}

export function getProduct(slug: string): Product {
  const product = readJson(
    resolve(CONTENT_DIR, 'products', slug, 'product.json'),
    ProductSchema,
  );
  if (product.slug !== slug) {
    throw new Error(`Folder "${slug}" holds product "${product.slug}"`);
  }
  return product;
}

// Returns null in public builds without touching the file
export function getProject(slug: string): Project | null {
  if (isPublicBuild) return null;
  const file = resolve(CONTENT_DIR, 'products', slug, 'project.json');
  if (!existsSync(file)) return null;
  return readJson(file, ProjectSchema);
}
