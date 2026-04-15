export const blogSchema = {
  create: {
    body: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        excerpt: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['draft', 'published'] },
      },
    },
  },
  update: {
    body: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        excerpt: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['draft', 'published'] },
        coverImageUrl: { type: 'string' },
      },
    },
  },
};
