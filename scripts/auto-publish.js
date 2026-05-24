import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
const RSS_FEED_URL = process.env.RSS_FEED_URL;
const GROUP_NAME = process.env.GROUP_NAME;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!RSS_FEED_URL || !GROUP_NAME) {
  console.error('Error: RSS_FEED_URL and GROUP_NAME environment variables are required');
  process.exit(1);
}

// Cache directory for tracking collected episodes
const CACHE_DIR = path.join(process.cwd(), '.rss-cache');
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
    
    // Parse shows
    const shows = [];
    const showRegex = /- title:\s*"([^"]+)"\n(?:\s+regex:\s*'([^']+)'\n)?(?:\s+tmdb_id:\s*(\d+)\n)?(?:\s+versions_expected:\s*\[([^\]]*)\]\n)?(?:\s+alsoIn:[^\n]*\n)?(?:\s+versions:[^\n]*\n)?/g;
    
    let showMatch;
    while ((showMatch = showRegex.exec(frontmatter)) !== null) {
      shows.push({
        title: showMatch[1],
        regex: showMatch[2] || '',
        tmdb_id: showMatch[3] ? parseInt(showMatch[3]) : null,
        versions_expected: showMatch[4] 
          ? showMatch[4].split(',').map(v => v.trim().replace(/^"|"$/g, '')).filter(Boolean)
          : ['简日内嵌', '繁日内嵌', '简繁日内封'],
      });
    }
    
    showcases.push({ file, season, shows, body });
  }
  
  return showcases;
}

function getGroupPatterns(groupName) {
  const tradName = groupName
    .replace(/绿/g, '綠')
    .replace(/茶/g, '茶')
    .replace(/组/g, '組');
  
  const patterns = [
    `[${groupName}]`,
    `【${groupName}】`,
  ];
  
  if (tradName !== groupName) {
    patterns.push(`[${tradName}]`, `【${tradName}】`);
  }
  
  return patterns;
}

function isOurGroup(title, patterns) {
  return patterns.some(pattern => title.includes(pattern));
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
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')  // Keep Chinese characters
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
    // Fallback: use TMDB CDN URL directly
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
  
  // Skip if already published
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
  
  const content = `---
title: "${title} 第${episode}集"
description: "${description}"${cover ? `\ncover: "${cover}"` : ''}
tags: [${tags.map(t => `"${t}"`).join(', ')}]
category: "anime"
pubDate: ${pubDate}
episode: ${episode}
${show.tmdb_id ? `tmdbId: ${show.tmdb_id}` : ''}
versions:
${versionsYaml}
---
`;
  
  fs.writeFileSync(filepath, content);
  console.log(`  Published: ${filename}`);
}

async function main() {
  try {
    console.log(`Fetching RSS from: ${RSS_FEED_URL}`);
    console.log(`Looking for group: ${GROUP_NAME}`);
    
    const showcases = loadShowcases();
    if (showcases.length === 0) {
      console.log('No showcase files found');
      return;
    }
    
    const groupPatterns = getGroupPatterns(GROUP_NAME);
    
    // Fetch RSS
    const response = await fetch(RSS_FEED_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const feed = parser.parse(xmlText);
    const items = feed.rss?.channel?.item || [];
    
    console.log(`Found ${items.length} items in RSS feed`);
    
    // Collect episodes for each show
    const showCaches = {};
    
    for (const item of items) {
      const title = item.title || '';
      
      if (!isOurGroup(title, groupPatterns)) {
        continue;
      }
      
      // Find matching show
      for (const showcase of showcases) {
        for (const show of showcase.shows) {
          const showName = show.title.split('/')[0].trim();
          const showNameEn = show.title.split('/')[1]?.trim();
          
          // Match by title (simplified - check if title contains show name)
          if (title.includes(showName) || (showNameEn && title.includes(showNameEn))) {
            const episode = extractEpisode(title, show.regex);
            const version = extractVersion(title);
            const magnet = extractMagnet(item.enclosure);
            
            if (episode && magnet) {
              console.log(`Found: ${showName} Ep${episode} [${version}]`);
              
              // Initialize cache
              if (!showCaches[show.title]) {
                showCaches[show.title] = {
                  show,
                  episodes: loadEpisodeCache(show.title),
                };
              }
              
              // Add version to episode
              if (!showCaches[show.title].episodes[episode]) {
                showCaches[show.title].episodes[episode] = { versions: {} };
              }
              
              showCaches[show.title].episodes[episode].versions[version] = {
                name: version,
                magnet,
              };
              
              // Save cache immediately
              saveEpisodeCache(show.title, showCaches[show.title].episodes);
            }
          }
        }
      }
    }
    
    // Check for complete episodes and publish
    for (const [showTitle, cacheData] of Object.entries(showCaches)) {
      const { show, episodes } = cacheData;
      
      for (const [episodeNum, episodeData] of Object.entries(episodes)) {
        if (isEpisodeComplete(episodeData, show.versions_expected)) {
          console.log(`\nEpisode ${episodeNum} complete for "${showTitle}"`);
          console.log(`  Versions: ${Object.keys(episodeData.versions).join(', ')}`);
          
          // Fetch TMDB info if available
          let tmdbInfo = null;
          if (show.tmdb_id && TMDB_API_KEY) {
            tmdbInfo = await fetchTMDBInfo(show.tmdb_id, 'tv');
          }
          
          // Publish work
          await publishWork(show, parseInt(episodeNum), episodeData, tmdbInfo);
          
          // Remove from cache after publishing
          delete episodes[episodeNum];
          saveEpisodeCache(showTitle, episodes);
        }
      }
    }
    
    console.log('\nDone!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
