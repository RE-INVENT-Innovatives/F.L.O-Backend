export const seoSchema = {
  upsert: {
    body: {
      type: 'object',
      properties: {
        metaTitle: { type: 'string' },
        metaDescription: { type: 'string' },
        ogTitle: { type: 'string' },
        ogDescription: { type: 'string' },
        ogImageUrl: { type: 'string', nullable: true },
        keywords: { type: 'array', items: { type: 'string' } },
        canonicalUrl: { type: 'string', nullable: true },
        twitterCard: { type: 'string' },
        twitterSite: { type: 'string', nullable: true },
        robotsIndex: { type: 'boolean' },
        robotsFollow: { type: 'boolean' },
      },
    },
  },
};
