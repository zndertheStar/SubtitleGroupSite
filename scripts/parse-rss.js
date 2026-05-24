import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RSS_FEED_URL = process.env.RSS_FEED_URL || 'https://api.animes.garden/feed.xml';
const GROUP_NAME = process.env.GROUP_NAME || '绿茶字幕组';
const GROUP_NAME_ALT = process.env.GROUP_NAME_ALT || '';

// Common group patterns in RSS titles
function getGroupPatterns(groupName) {
  // Auto-generate traditional Chinese variant
  const tradName = groupName
    .replace(/绿/g, '綠')
    .replace(/茶/g, '茶')
    .replace(/组/g, '組');
  
  const patterns = [
    `[${groupName}]`,
    `【${groupName}】`,
    `[${groupName}×`,
    `×${groupName}]`,
    `&${groupName}]`,
  ];
  
  // Add traditional Chinese variant if different
  if (tradName !== groupName) {
    patterns.push(
      `[${tradName}]`,
      `【${tradName}】`,
      `[${tradName}×`,
      `×${tradName}]`,
      `&${tradName}]`,
    );
  }
  
  // Also check for alternative name if provided
  if (GROUP_NAME_ALT) {
    patterns.push(
      `[${GROUP_NAME_ALT}]`,
      `【${GROUP_NAME_ALT}】`,
    );
  }
  
  return patterns;
}

// Extract episode number from title using regex
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
  
  // Default patterns for episode extraction
  const patterns = [
    /\[?(\d{2,3})\]?[\s_\]]/,           // [05] or 05 or 05]
    /第(\d+)集?/,                        // 第05集
    /-(\d+)\s*\[/,                     // - 05 [
    /-(\d+)\s*\(/,                     // - 05 (
    /-(\d+)\s*\./,                     // - 05.
    /\[(\d+)\]/,                        // [05]
    /(\d+)\s*\[/,                      // 05 [
    /\s(\d{2})\s/,                     // space 05 space
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return null;
}

// Extract source/version from title
function extractSource(title) {
  const sources = {
    'Baha': ['Baha', '巴哈', '巴哈姆特'],
    'CR': ['CR', 'Crunchyroll'],
    'ABEMA': ['ABEMA', 'Abema'],
    'B-Global': ['B-Global', 'Bilibili Global'],
    'ViuTV': ['ViuTV', 'Viu'],
    'IQIYI': ['IQIYI', '爱奇艺'],
    'Netflix': ['Netflix', 'NF'],
    'Web': ['WebRip', 'WEB-DL', 'WEBDL', 'Web'],
    'BD': ['BDRip', 'BD', 'Blu-ray', 'Bluray'],
    'DVD': ['DVDRip', 'DVD'],
  };
  
  for (const [source, aliases] of Object.entries(sources)) {
    for (const alias of aliases) {
      if (title.includes(alias)) {
        return source;
      }
    }
  }
  
  return 'Web';
}

// Check if title is from our group
function isOurGroup(title, patterns) {
  return patterns.some(pattern => title.includes(pattern));
}

async function main() {
  try {
    console.log(`Fetching RSS from: ${RSS_FEED_URL}`);
    console.log(`Looking for group: ${GROUP_NAME}`);
    
    // Fetch RSS feed
    const response = await fetch(RSS_FEED_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    
    const feed = parser.parse(xmlText);
    const items = feed.rss?.channel?.item || [];
    
    console.log(`Found ${items.length} items in RSS feed`);
    
    const groupPatterns = getGroupPatterns(GROUP_NAME);
    
    // Read all showcase files
    const showcaseDir = path.join(process.cwd(), 'src/content/showcase');
    if (!fs.existsSync(showcaseDir)) {
      console.log('No showcase directory found');
      return;
    }
    
    const files = fs.readdirSync(showcaseDir).filter(f => f.endsWith('.md') || f.endsWith('.yml') || f.endsWith('.yaml'));
    console.log(`Found ${files.length} showcase files`);
    
    let updated = false;
    
    for (const file of files) {
      const filePath = path.join(showcaseDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!frontmatterMatch) {
        console.log(`Skipping ${file}: no frontmatter found`);
        continue;
      }
      
      let frontmatter = frontmatterMatch[1];
      const body = frontmatterMatch[2];
      
      // Simple YAML parsing for shows array
      // This is a simplified parser - for production use a proper YAML library
      const showsMatch = frontmatter.match(/shows:\n([\s\S]*?)(?:\n[a-zA-Z]|$)/);
      if (!showsMatch) {
        console.log(`Skipping ${file}: no shows found`);
        continue;
      }
      
      // Parse shows to find which ones to update
      // For each show, check regex and update episodes
      const showsLines = showsMatch[1].split('\n');
      let currentShow = null;
      let currentVersion = null;
      let inShows = false;
      let showIndex = 0;
      
      // Simple state machine to parse YAML structure
      const shows = [];
      let currentShowObj = null;
      let currentVersionObj = null;
      
      for (const line of showsLines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('- title:')) {
          if (currentShowObj) shows.push(currentShowObj);
          currentShowObj = {
            title: trimmed.replace('- title:', '').trim().replace(/^"|"$/g, ''),
            regex: '',
            versions: [],
            alsoIn: [],
          };
          currentVersionObj = null;
        } else if (trimmed.startsWith('regex:') && currentShowObj) {
          currentShowObj.regex = trimmed.replace('regex:', '').trim().replace(/^'|'$/g, '').replace(/^"|"$/g, '');
        } else if (trimmed.startsWith('alsoIn:') && currentShowObj) {
          // Parse array
        } else if (trimmed.startsWith('- name:') && currentShowObj) {
          currentVersionObj = {
            name: trimmed.replace('- name:', '').trim().replace(/^"|"$/g, ''),
            episodes: [],
          };
          currentShowObj.versions.push(currentVersionObj);
        } else if (trimmed.startsWith('episodes:') && currentVersionObj) {
          // Parse episodes array
          const epMatch = trimmed.match(/\[(.*?)\]/);
          if (epMatch) {
            currentVersionObj.episodes = epMatch[1].split(',').map(e => parseInt(e.trim())).filter(e => !isNaN(e));
          }
        }
      }
      
      if (currentShowObj) shows.push(currentShowObj);
      
      console.log(`Parsed ${shows.length} shows from ${file}`);
      
      // Check each RSS item against our shows
      for (const item of items) {
        const title = item.title || '';
        
        if (!isOurGroup(title, groupPatterns)) {
          continue;
        }
        
        console.log(`Found group release: ${title.substring(0, 80)}...`);
        
        // Try to match against each show
        for (const show of shows) {
          // Check if title contains show title (simplified matching)
          if (title.includes(show.title) || show.title.split('/').some(part => title.includes(part.trim()))) {
            const episode = extractEpisode(title, show.regex);
            const source = extractSource(title);
            
            if (episode) {
              console.log(`  -> Matched show: ${show.title}, Episode: ${episode}, Source: ${source}`);
              
              // Find or create version
              let version = show.versions.find(v => v.name === source);
              if (!version) {
                // If no matching version, use first one or create
                version = show.versions[0];
              }
              
              if (version && !version.episodes.includes(episode)) {
                version.episodes.push(episode);
                version.episodes.sort((a, b) => a - b);
                updated = true;
                console.log(`     Added episode ${episode} to ${version.name}`);
              }
            }
          }
        }
      }
      
      // If updated, write back
      if (updated) {
        // Reconstruct frontmatter
        let newFrontmatter = `season: "${frontmatter.match(/season:\s*"([^"]+)"/)?.[1] || ''}"\nshows:`;
        
        for (const show of shows) {
          newFrontmatter += `\n  - title: "${show.title}"`;
          newFrontmatter += `\n    regex: '${show.regex}'`;
          if (show.alsoIn && show.alsoIn.length > 0) {
            newFrontmatter += `\n    alsoIn: [${show.alsoIn.map(a => `"${a}"`).join(', ')}]`;
          } else {
            newFrontmatter += `\n    alsoIn: []`;
          }
          newFrontmatter += `\n    versions:`;
          
          for (const version of show.versions) {
            newFrontmatter += `\n      - name: "${version.name}"`;
            newFrontmatter += `\n        episodes: [${version.episodes.join(', ')}]`;
          }
        }
        
        const newContent = `---\n${newFrontmatter}\n---\n${body}`;
        fs.writeFileSync(filePath, newContent);
        console.log(`Updated ${file}`);
      }
    }
    
    if (!updated) {
      console.log('No updates needed');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
