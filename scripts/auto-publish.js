import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const RSS_BASE_URL = 'https://share.dmhy.org/topics/rss/rss.xml';

// Cache directories (stored in repo to persist across GitHub Actions runs)
const CACHE_DIR = path.join(process.cwd(), 'src/content/.rss-cache');
const TMDB_CACHE_DIR = path.join(CACHE_DIR, 'tmdb');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}
if (!fs.existsSync(TMDB_CACHE_DIR)) {
  fs.mkdirSync(TMDB_CACHE_DIR, { recursive: true });
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
    // Normalize: convert traditional "內" to simplified "内"
    return versionMatch[1].replace(/內/g, '内');
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

function versionSlug(versionName) {
  return versionName
    .replace(/简繁日内封/, 'chs-cht-sub')
    .replace(/简日内嵌/, 'chs-embed')
    .replace(/繁日内嵌/, 'cht-embed')
    .replace(/[^\w-]/g, '')
    .toLowerCase() || 'default';
}

function findExistingWork(showSlug, episode, versionSlugStr) {
  const worksDir = path.join(process.cwd(), 'src/content/works');
  if (!fs.existsSync(worksDir)) return null;
  const episodeStr = String(episode).padStart(2, '0');
  const suffix = `-${showSlug}-${episodeStr}-${versionSlugStr}.md`;
  const files = fs.readdirSync(worksDir);
  const match = files.find(f => f.endsWith(suffix));
  return match ? path.join(worksDir, match) : null;
}

function getPublishedVersionSlugs(showSlug, episode) {
  const worksDir = path.join(process.cwd(), 'src/content/works');
  if (!fs.existsSync(worksDir)) return [];
  const episodeStr = String(episode).padStart(2, '0');
  const infix = `-${showSlug}-${episodeStr}-`;
  const files = fs.readdirSync(worksDir).filter(f => f.includes(infix));
  return files.map(f => {
    const afterInfix = f.substring(f.indexOf(infix) + infix.length);
    const vSlug = afterInfix.replace(/\.md$/, '');
    return vSlug || null;
  }).filter(Boolean);
}

const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Call TMDB API (with caching)
async function fetchTMDBInfo(tmdbId, type = 'tv') {
  if (!TMDB_API_KEY) {
    return null;
  }
  
  const cacheKey = `${type}-${tmdbId}`;
  const cacheFile = path.join(TMDB_CACHE_DIR, `${cacheKey}.json`);
  
  // Load from file cache if exists and not expired
  if (fs.existsSync(cacheFile)) {
    try {
      const stat = fs.statSync(cacheFile);
      const ageMs = Date.now() - stat.mtimeMs;
      if (ageMs < CACHE_MAX_AGE_MS) {
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        console.log(`  TMDB cache hit: ${cacheKey}`);
        return cached;
      }
      console.log(`  TMDB cache expired (${Math.round(ageMs / 86400000)}d), refreshing: ${cacheKey}`);
      fs.unlinkSync(cacheFile);
    } catch (e) {
      console.log(`  TMDB cache read failed: ${cacheKey}`);
    }
  }
  
  try {
    // Fetch basic info
    const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=zh-CN`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    const data = await response.json();
    
    // Fetch credits (cast and crew)
    try {
      const creditsUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=zh-CN`;
      const creditsResponse = await fetch(creditsUrl);
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        data.credits = creditsData;
      }
    } catch (e) {
      console.log('  TMDB credits fetch failed:', e.message);
    }
    
    // Fetch external IDs (IMDb, etc)
    try {
      const extUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`;
      const extResponse = await fetch(extUrl);
      if (extResponse.ok) {
        const extData = await extResponse.json();
        data.external_ids = extData;
      }
    } catch (e) {
      console.log('  TMDB external_ids fetch failed:', e.message);
    }
    
    // Save to file cache
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
    return data;
  } catch (e) {
    console.error('TMDB fetch error:', e.message);
    return null;
  }
}

// Download cover image (stored in public/images/covers, reused if exists)
async function downloadCover(imageUrl, showSlug) {
  if (!imageUrl) return null;
  
  const coversDir = path.join(process.cwd(), 'public/images/covers');
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }
  
  const filename = `${showSlug}.jpg`;
  const filepath = path.join(coversDir, filename);
  
  // If already downloaded, reuse
  if (fs.existsSync(filepath)) {
    return `/images/covers/${filename}`;
  }
  
  try {
    const response = await fetch(`https://image.tmdb.org/t/p/w500${imageUrl}`);
    if (!response.ok) throw new Error(`Image download failed: ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`  Downloaded cover: ${filename}`);
    return `/images/covers/${filename}`;
  } catch (e) {
    console.error('  Cover download error:', e.message);
    // Return remote URL as fallback
    return `https://image.tmdb.org/t/p/w500${imageUrl}`;
  }
}

async function publishWork(show, episode, versionName, magnet, tmdbInfo, coverPath) {
  const worksDir = path.join(process.cwd(), 'src/content/works');
  if (!fs.existsSync(worksDir)) {
    fs.mkdirSync(worksDir, { recursive: true });
  }
  
  const showSlug = slugify(show.title.split('/')[0].trim());
  const vSlug = versionSlug(versionName);
  const existingPath = findExistingWork(showSlug, episode, vSlug);
  
  if (existingPath) {
    console.log(`  Already exists: ep${episode} [${versionName}]`);
    return false;
  }
  
  const pubDate = new Date().toISOString().split('T')[0];
  const filename = `${pubDate}-${showSlug}-${String(episode).padStart(2, '0')}-${vSlug}.md`;
  const filepath = path.join(worksDir, filename);
  
  let title = show.title.split('/')[0].trim();
  let description = show.title.split('/')[0].trim();
  let cover = coverPath || '';
  let tags = ['动画'];
  
  let originalTitle = '';
  let genres = [];
  let language = 'Japanese';
  let firstAirDate = '';
  let numberOfEpisodes = null;
  let numberOfSeasons = null;
  let episodeRuntime = null;
  let productionCountries = [];
  let rating = null;
  let tmdbUrl = '';
  let imdbId = '';
  let cast = [];
  let crew = [];
  
  if (tmdbInfo) {
    title = tmdbInfo.name || title;
    description = tmdbInfo.overview || description;
    tags = tmdbInfo.genres ? tmdbInfo.genres.map(g => g.name) : tags;
    
    originalTitle = tmdbInfo.original_name || '';
    genres = tmdbInfo.genres ? tmdbInfo.genres.map(g => g.name) : [];
    language = tmdbInfo.spoken_languages && tmdbInfo.spoken_languages[0] 
      ? tmdbInfo.spoken_languages[0].english_name 
      : 'Japanese';
    firstAirDate = tmdbInfo.first_air_date || '';
    numberOfEpisodes = tmdbInfo.number_of_episodes || null;
    numberOfSeasons = tmdbInfo.number_of_seasons || null;
    episodeRuntime = tmdbInfo.episode_run_time && tmdbInfo.episode_run_time[0] 
      ? tmdbInfo.episode_run_time[0] 
      : null;
    productionCountries = tmdbInfo.production_countries 
      ? tmdbInfo.production_countries.map(c => c.name) 
      : [];
    rating = tmdbInfo.vote_average || null;
    tmdbUrl = `https://www.themoviedb.org/tv/${show.tmdb_id}`;
    imdbId = tmdbInfo.external_ids?.imdb_id || '';
    
    if (tmdbInfo.credits) {
      cast = (tmdbInfo.credits.cast || []).slice(0, 10).map(c => ({
        name: c.name,
        character: c.character || '',
        profilePath: c.profile_path || '',
      }));
      crew = (tmdbInfo.credits.crew || [])
        .filter(c => c.job === 'Producer' || c.job === 'Executive Producer')
        .map(c => ({ name: c.name, job: c.job }));
    }
  }
  
  const fm = [];
  fm.push(`title: "${title} 第${episode}集 ${versionName}"`);
  fm.push(`description: "${description}"`);
  if (cover) fm.push(`cover: "${cover}"`);
  fm.push(`tags: [${tags.map(t => `"${t}"`).join(', ')}]`);
  fm.push(`category: "anime"`);
  fm.push(`pubDate: ${pubDate}`);
  fm.push(`episode: ${episode}`);
  if (show.tmdb_id) fm.push(`tmdbId: ${show.tmdb_id}`);
  if (originalTitle) fm.push(`originalTitle: "${originalTitle}"`);
  if (genres.length > 0) fm.push(`genres: [${genres.map(g => `"${g}"`).join(', ')}]`);
  if (language) fm.push(`language: "${language}"`);
  if (firstAirDate) fm.push(`firstAirDate: "${firstAirDate}"`);
  if (numberOfEpisodes) fm.push(`numberOfEpisodes: ${numberOfEpisodes}`);
  if (numberOfSeasons) fm.push(`numberOfSeasons: ${numberOfSeasons}`);
  if (episodeRuntime) fm.push(`episodeRuntime: ${episodeRuntime}`);
  if (productionCountries.length > 0) fm.push(`productionCountries: [${productionCountries.map(c => `"${c}"`).join(', ')}]`);
  if (rating) fm.push(`rating: ${rating}`);
  if (tmdbUrl) fm.push(`tmdbUrl: "${tmdbUrl}"`);
  if (imdbId) fm.push(`imdbId: "${imdbId}"`);
  if (cast.length > 0) {
    fm.push(`cast:`);
    cast.forEach(c => {
      fm.push(`  - name: "${c.name}"`);
      if (c.character) fm.push(`    character: "${c.character}"`);
      if (c.profilePath) fm.push(`    profilePath: "${c.profilePath}"`);
    });
  }
  if (crew.length > 0) {
    fm.push(`crew:`);
    crew.forEach(c => {
      fm.push(`  - name: "${c.name}"`);
      if (c.job) fm.push(`    job: "${c.job}"`);
    });
  }
  fm.push(`versions:`);
  fm.push(`    - name: "${versionName}"`);
  fm.push(`      magnet: "${magnet}"`);
  
  const content = `---\n${fm.join('\n')}\n---\n`;
  
  fs.writeFileSync(filepath, content);
  console.log(`  Published: ${filename}`);
  return true;
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

function updateShowcaseEpisodes(showcaseFile, showTitle, episodes, show) {
  const filePath = path.join(process.cwd(), 'src/content/showcase', showcaseFile);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const versionEpisodes = {};
  
  const slugToName = {};
  const nameToSlug = {};
  
  for (const [epNum, epData] of Object.entries(episodes)) {
    for (const versionName of Object.keys(epData.versions || {})) {
      if (!versionEpisodes[versionName]) versionEpisodes[versionName] = [];
      if (!versionEpisodes[versionName].includes(parseInt(epNum))) {
        versionEpisodes[versionName].push(parseInt(epNum));
      }
      const vs = versionSlug(versionName);
      slugToName[vs] = versionName;
      nameToSlug[versionName] = vs;
    }
  }
  
  const showSlug = slugify(show.title.split('/')[0].trim());
  const worksDir = path.join(process.cwd(), 'src/content/works');
  if (fs.existsSync(worksDir)) {
    const workFiles = fs.readdirSync(worksDir).filter(f => f.includes(`-${showSlug}-`));
    for (const wf of workFiles) {
      const infix = `-${showSlug}-`;
      const afterInfix = wf.substring(wf.indexOf(infix) + infix.length);
      const m = afterInfix.match(/^(\d{2,3})-(.+)\.md$/);
      if (!m) continue;
      const epNum = parseInt(m[1]);
      const vSlugStr = m[2];
      const vName = slugToName[vSlugStr] || vSlugStr;
      if (!versionEpisodes[vName]) versionEpisodes[vName] = [];
      if (!versionEpisodes[vName].includes(epNum)) {
        versionEpisodes[vName].push(epNum);
      }
    }
  }
  
  for (const versionName of Object.keys(versionEpisodes)) {
    versionEpisodes[versionName].sort((a, b) => a - b);
  }
  
  const titleMarker = `- title: "${showTitle}"`;
  const titleIndex = content.indexOf(titleMarker);
  
  if (titleIndex === -1) {
    console.log(`    Warning: Could not find show "${showTitle}" in showcase file`);
    return;
  }
  
  let blockEnd = content.indexOf('\n  - title:', titleIndex + titleMarker.length);
  if (blockEnd === -1) blockEnd = content.indexOf('\n---', titleIndex + titleMarker.length);
  if (blockEnd === -1) blockEnd = content.length;
  
  let showBlock = content.substring(titleIndex, blockEnd);
  let updated = false;
  
  for (const [versionName, eps] of Object.entries(versionEpisodes)) {
    const versionRegex = new RegExp(`(- name:\\s*"${versionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*\\n\\s*episodes:\\s*)\\[[^\\]]*\\]`);
    if (versionRegex.test(showBlock)) {
      showBlock = showBlock.replace(versionRegex, `$1[${eps.join(', ')}]`);
      updated = true;
      console.log(`    Updated ${versionName}: [${eps.join(', ')}]`);
    }
  }
  
  if (updated) {
    content = content.substring(0, titleIndex) + showBlock + content.substring(blockEnd);
    fs.writeFileSync(filePath, content);
    console.log(`    Updated showcase: ${showcaseFile}`);
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
        
        updateShowcaseEpisodes(showcase.file, show.title, episodes, show);
        
        // Fetch TMDB info once per show (reused for all episodes)
        let tmdbInfo = null;
        let coverPath = '';
        if (show.tmdb_id && TMDB_API_KEY) {
          tmdbInfo = await fetchTMDBInfo(show.tmdb_id, 'tv');
          if (tmdbInfo && tmdbInfo.poster_path) {
            const showSlug = slugify(show.title.split('/')[0].trim());
            coverPath = await downloadCover(tmdbInfo.poster_path, showSlug);
          }
        }
        
        for (const [episodeNum, episodeData] of Object.entries(episodes)) {
          for (const [versionName, versionData] of Object.entries(episodeData.versions)) {
            const published = await publishWork(show, parseInt(episodeNum), versionName, versionData.magnet, tmdbInfo, coverPath);
            if (published) totalPublished++;
          }
          
          if (show.versions_expected && show.versions_expected.length > 0) {
            const showSlug = slugify(show.title.split('/')[0].trim());
            const publishedSlugs = getPublishedVersionSlugs(showSlug, parseInt(episodeNum));
            const expectedSlugs = show.versions_expected.map(v => versionSlug(v));
            const allPublished = expectedSlugs.every(s => publishedSlugs.includes(s));
            if (allPublished) {
              delete episodes[episodeNum];
              console.log(`    Episode ${episodeNum} all versions published, removed from cache`);
            }
          } else {
            delete episodes[episodeNum];
          }
        }
        saveEpisodeCache(show.title, episodes);
      }
    }
    
    console.log(`\n\nDone! Published ${totalPublished} new work(s).`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
