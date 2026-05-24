import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.enum(['anime', 'movie', 'ova', 'other']).default('anime'),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    featured: z.boolean().default(false),
    season: z.string().optional(),
    episode: z.number().optional(),
    source: z.string().optional(),
    lang: z.array(z.enum(['zh', 'ja', 'en'])).default(['zh']),
    tmdbId: z.number().optional(),
    versions: z.array(
      z.object({
        name: z.string(),
        magnet: z.string(),
      })
    ).default([]),
  }),
});

const misc = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/misc' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    lang: z.array(z.enum(['zh', 'ja', 'en'])).default(['zh']),
  }),
});

const showcase = defineCollection({
  loader: glob({ pattern: '**/*.{md,yml,yaml}', base: './src/content/showcase' }),
  schema: z.object({
    season: z.string(),
    shows: z.array(
      z.object({
        title: z.string(),
        regex: z.string(),
        tmdb_id: z.number().optional(),
        versions_expected: z.array(z.string()).default([]),
        versions: z.array(
          z.object({
            name: z.string(),
            episodes: z.array(z.number()).default([]),
          })
        ).default([]),
        alsoIn: z.array(z.string()).default([]),
      })
    ).default([]),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/about' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    updatedDate: z.coerce.date().optional(),
    members: z.array(
      z.object({
        icon: z.string().optional(),
        name: z.string(),
        role: z.string().optional(),
      })
    ).default([]),
    contacts: z.array(
      z.object({
        icon: z.string().optional(),
        name: z.string(),
        description: z.string().optional(),
        url: z.string().optional(),
      })
    ).default([]),
  }),
});

export const collections = { works, misc, showcase, about };
