import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const RSS_BASE_URL = 'https://share.dmhy.org/topics/rss/rss.xml';

// Cache directory for tracking collected episodes (stored in repo)
const CACHE_DIR = path.join(process.cwd(), 'src/content/.rss-cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Load showcase configs
function loadShowcases() {
  const showcaseDir = path.join(process.cwd(), 'src/content/showcase');
  if (!fs.existsSync(showcaseDir)) return [];
  
  const files = fs.readdirSync(showcaseDir).filter(f => f.endsWith('.md') || f.endsWith('.yml') || f.endsWith('.yaml'));
  
  const showcases = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(showcaseDir, file), 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) continue;
    
    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2];
    
    // Parse season
    const seasonMatch = frontmatter.match(/season:\s*"([^"]+)"/);
    const season = seasonMatch ? seasonMatch[1] : '';
    
    // Parse shows - improved regex to handle multiline
    const shows = [];
    const showBlocks = frontmatter.split(/\n  - title:/).slice(1);
    
    for (const block of showBlocks) {
      const titleMatch = block.match(/^\s*"([^"]+)"/);
      const regexMatch = block.match(/regex:\s*'([^']+)'/);
      const tmdbMatch = block.match(/tmdb_id:\s*(\d+)/);
      const searchMatch = block.match(/rss_search:\s*"([^"]+)"/);
      const versionsExpectedMatch = block.match(/versions_expected:\s*\[([^\]]*)\]/);
      
      if (titleMatch) {
        shows.push({
          title: titleMatch[1],
          regex: regexMatch ? regexMatch[1] : '',
          tmdb_id: tmdbMatch ? parseInt(tmdbMatch[1]) : null,
          rss_search: searchMatch ? searchMatch[1] : null,
          versions_expected: versionsExpectedMatch 
            ? versionsExpectedMatch[1].split(',').map(v => v.trim().replace(/^"|"$/g, '')).filter(Boolean)
            : ['简日内嵌', '繁日内嵌', '简繁日内封'],
        });
      }
    }
    
    showcases.push({ file, season, shows, body });
  }
  
  return showcases;
}

function extractEpisode(title, customRegex) {
  if (customRegex) {
    try {
      const regex = new RegExp(customRegex);
      const match = title.match(regex);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    } catch (e) {
      console.error(`Invalid regex: ${customRegex}`, e.message);
    }
  }
  
  const patterns = [
    /\[?(\d{2,3})\]?[\s_\]]/,
    /第(\d+)集?/,
    /- (\d+)\s*\[/,
    /\[(\d+)\]/,
    /(\d+)\s*\[/,
    /\s(\d{2})\s/,
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return null;
}

function extractVersion(title) {
  // Extract version from the end of title: [简日内嵌], [繁日内嵌], [简繁日内封], etc.
  const versionMatch = title.match(/\[([^\]]+?)\](?!.*\[)/);
  if (versionMatch) {
    return versionMatch[1];
  }
  return '默认';
}

function extractMagnet(enclosure) {
  if (enclosure && enclosure['@_url']) {
    return enclosure['@_url'];
  }
  return '';
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// Load cache for a show
function loadEpisodeCache(showTitle) {
  const cacheFile = path.join(CACHE_DIR, `${slugify(showTitle)}.json`);
  if (fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
  }
  return {};
}

// Save cache for a show
function saveEpisodeCache(showTitle, cache) {
  const cacheFile = path.join(CACHE_DIR, `${slugify(showTitle)}.json`);
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
}

// Check if episode has all expected versions
function isEpisodeComplete(episodeData, expectedVersions) {
  if (!expectedVersions || expectedVersions.length === 0) return true;
  const collectedVersions = Object.keys(episodeData.versions);
  return expectedVersions.every(v => collectedVersions.includes(v));
}

// Call TMDB API
async function fetchTMDBInfo(tmdbId, type = 'tv') {
  if (!TMDB_API_KEY) {
    console.error('Warning: TMDB_API_KEY not set, skipping TMDB fetch');
    return null;
  }
  
  try {
    const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=zh-CN`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    return await response.json();
  } catch (e) {
    console.error('TMDB fetch error:', e.message);
    return null;
  }
}

// Download cover image
async function downloadCover(imageUrl, filename) {
  if (!imageUrl) return null;
  
  const coversDir = path.join(process.cwd(), 'public/images/covers');
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }
  
  const filepath = path.join(coversDir, filename);
  
  try {
    const response = await fetch(`https://image.tmdb.org/t/p/w500${imageUrl}`);
    if (!response.ok) throw new Error(`Image download failed: ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`  Downloaded cover: ${filename}`);
    return `/images/covers/${filename}`;
  } catch (e) {
    console.error('  Cover download error:', e.message);
    return `https://image.tmdb.org/t/p/w500${imageUrl}`;
  }
}

// Generate work file
async function publishWork(show, episode, episodeData, tmdbInfo) {
  const worksDir = path.join(process.cwd(), 'src/content/works');
  if (!fs.existsSync(worksDir)) {
    fs.mkdirSync(worksDir, { recursive: true });
  }
  
  const showSlug = slugify(show.title.split('/')[0].trim());
  const pubDate = new Date().toISOString().split('T')[0];
  const filename = `${pubDate}-${showSlug}-${String(episode).padStart(2, '0')}.md`;
  const filepath = path.join(worksDir, filename);
  
  if (fs.existsSync(filepath)) {
    console.log(`  Work already exists: ${filename}`);
    return;
  }
  
  let title = show.title.split('/')[0].trim();
  let description = '';
  let cover = '';
  let tags = ['动画'];
  
  if (tmdbInfo) {
    title = tmdbInfo.name || title;
    description = tmdbInfo.overview || '';
    tags = tmdbInfo.genres ? tmdbInfo.genres.map(g => g.name) : tags;
    
    const coverFilename = `${showSlug}-${String(episode).padStart(2, '0')}.jpg`;
    cover = await downloadCover(tmdbInfo.poster_path, coverFilename);
  }
  
  const versionsYaml = Object.values(episodeData.versions).map(v => 
    `    - name: "${v.name}"\n      magnet: "${v.magnet}"`
  ).join('\n');
  
  const coverLine = cover ? `\ncover: "${cover}"` : '';
  const tmdbLine = show.tmdb_id ? `\ntmdbId: ${show.tmdb_id}` : '';
  
  const content = `---
title: "${title} 第${episode}集"
description: "${description}"${coverLine}
tags: [${tags.map(t => `"${t}"`).join(', ')}]
category: "anime"
pubDate: ${pubDate}
episode: ${episode}${tmdbLine}
versions:
${versionsYaml}
---
`;
  
  fs.writeFileSync(filepath, content);
  console.log(`  Published: ${filename}`);
}

// Fetch RSS for a specific show
async function fetchShowRSS(searchKeyword) {
  const searchUrl = `${RSS_BASE_URL}?keyword=${encodeURIComponent(searchKeyword)}`;
  console.log(`  Fetching: ${searchUrl}`);
  
  try {
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const feed = parser.parse(xmlText);
    return feed.rss?.channel?.item || [];
  } catch (e) {
    console.error(`  Error fetching RSS: ${e.message}`);
    return [];
  }
}

async function main() {
  try {
    console.log('Auto-publish works from RSS search\n');
    
    const showcases = loadShowcases();
    if (showcases.length === 0) {
      console.log('No showcase files found');
      return;
    }
    
    let totalPublished = 0;
    
    for (const showcase of showcases) {
      console.log(`\nSeason: ${showcase.season}`);
      
      for (const show of showcase.shows) {
        console.log(`\n  Show: ${show.title}`);
        
        // Skip shows without rss_search
        if (!show.rss_search) {
          console.log('    Skipped: no rss_search configured');
          continue;
        }
        
        // Load existing cache
        const episodes = loadEpisodeCache(show.title);
        
        // Fetch RSS for this show
        const items = await fetchShowRSS(show.rss_search);
        console.log(`    Found ${items.length} items`);
        
        if (items.length === 0) continue;
        
        // Process each item
        for (const item of items) {
          const title = item.title || '';
          const episode = extractEpisode(title, show.regex);
          const version = extractVersion(title);
          const magnet = extractMagnet(item.enclosure);
          
          if (episode && magnet) {
            console.log(`      [${title.substring(0, 60)}...] Ep${episode} [${version}]`);
            
            if (!episodes[episode]) {
              episodes[episode] = { versions: {} };
            }
            
            episodes[episode].versions[version] = {
              name: version,
              magnet,
            };
          }
        }
        
        // Save cache
        saveEpisodeCache(show.title, episodes);
        
        // Check for complete episodes and publish
        for (const [episodeNum, episodeData] of Object.entries(episodes)) {
          if (isEpisodeComplete(episodeData, show.versions_expected)) {
            console.log(`\n    Episode ${episodeNum} complete`);
            console.log(`      Versions: ${Object.keys(episodeData.versions).join(', ')}`);
            
            let tmdbInfo = null;
            if (show.tmdb_id && TMDB_API_KEY) {
              tmdbInfo = await fetchTMDBInfo(show.tmdb_id, 'tv');
            }
            
            await publishWork(show, parseInt(episodeNum), episodeData, tmdbInfo);
            totalPublished++;
            
            // Remove from cache after publishing
            delete episodes[episodeNum];
            saveEpisodeCache(show.title, episodes);
          }
        }
      }
    }
    
    console.log(`\n\nDone! Published ${totalPublished} new work(s).`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
