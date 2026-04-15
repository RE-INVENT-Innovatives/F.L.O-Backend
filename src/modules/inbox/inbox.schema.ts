export const inboxSchema = {
  createPublic: {
    body: {
      type: 'object',
      required: ['name', 'email', 'subject', 'message', 'portfolioUsername'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        subject: { type: 'string' },
        message: { type: 'string' },
        portfolioUsername: { type: 'string' },
      },
    },
  },
};
