/**
 * Resolves experience asset paths against the deployment base path so the
 * same configuration works at "/", "/afterglow-experiences/" or "/mejoramigaisa/".
 */
export function assetUrl(slug: string, src: string, base = import.meta.env.BASE_URL): string {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:') || src.startsWith('blob:')) return src;
  const prefix = base.endsWith('/') ? base : `${base}/`;
  const path = src.replace(/^\.?\//, '');
  return `${prefix}experiences/${slug}/${path}`;
}
