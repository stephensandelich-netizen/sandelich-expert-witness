import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

// services collection
const servicesCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*{md,mdx}", base: "./src/data/services" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      titleLong: z.string(),
      description: z.string(),
      icon: z.string(),
      image: image(),
      mappingKey: z.string().optional(),
      order: z.number().optional(),
      draft: z.boolean().optional(),
    }),
});

// other pages
const otherPagesCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*{md,mdx}", base: "./src/data/otherPages" }),
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
      // mappingKey allows you to match entries across languages for SEO purposes
      mappingKey: z.string().optional(),
      draft: z.boolean().optional(),
    }),
});

export const collections = {
  otherPages: otherPagesCollection,
  services: servicesCollection,
};
