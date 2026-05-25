import fs from 'fs';
import path from 'path';

const TMDB_CACHE_DIR = path.join(process.cwd(), 'src/content/.rss-cache/tmdb');
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export function getTMDBCover(tmdbId: number | undefined, size: 'w200' | 'w500' = 'w500'): string | null {
  if (!tmdbId) return null;

  const cacheFile = path.join(TMDB_CACHE_DIR, `tv-${tmdbId}.json`);
  if (!fs.existsSync(cacheFile)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    if (data.poster_path) {
      const base = size === 'w200' ? 'https://image.tmdb.org/t/p/w200' : TMDB_IMAGE_BASE;
      return `${base}${data.poster_path}`;
    }
  } catch {
    // ignore
  }
  return null;
}
