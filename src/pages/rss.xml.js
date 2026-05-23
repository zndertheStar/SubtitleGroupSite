import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const works = await getCollection('works');
  const sortedWorks = works.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  
  return rss({
    title: '绿茶字幕组',
    description: '绿茶字幕组官方网站 - 最新作品发布',
    site: context.site,
    items: sortedWorks.map(work => ({
      title: work.data.title,
      pubDate: work.data.pubDate,
      description: work.data.description || '',
      link: `/works/${work.slug}/`,
      categories: work.data.tags,
    })),
    customData: `<language>zh-CN</language>`,
  });
}
