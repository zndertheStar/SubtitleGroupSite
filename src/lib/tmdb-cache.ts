import fs from 'fs';
import path from 'path';

const TMDB_CACHE_DIR = path.join(process.cwd(), 'src/content/.rss-cache/tmdb');
const COVERS_DIR = path.join(process.cwd(), 'public/images/covers');
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

/** 从作品文件 id 提取作品基础 slug（与 auto-publish.js 生成封面文件名一致） */
function extractShowSlug(workId: string): string | null {
  // 格式: 2026-05-25-上伊那牡丹酒醉身姿似百合花般-01-cht-embed
  // 或: 2026-05-24-re从零开始的异世界生活-第四期-67
  const withoutDate = workId.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  if (!withoutDate) return null;

  // 去掉末尾的 -集数 和可选的 -版本后缀
  const match = withoutDate.match(/^(.+?)-\d{1,3}(?:-[a-z0-9-]+)?$/);
  return match ? match[1] : withoutDate;
}

/** 获取作品封面：优先使用本地手动替换的封面，否则回退到 TMDB 远程 URL */
export function getCover(workId: string, tmdbId?: number, size: 'w200' | 'w500' = 'w500'): string | null {
  const showSlug = extractShowSlug(workId);
  if (showSlug) {
    const localPath = path.join(COVERS_DIR, `${showSlug}.jpg`);
    if (fs.existsSync(localPath)) {
      return `/images/covers/${showSlug}.jpg`;
    }
  }

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

/** 仅获取 TMDB 远程封面 URL（保留以备后用） */
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
