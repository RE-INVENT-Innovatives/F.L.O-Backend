export const updateReposSchema = {
  tags: ['Portfolio'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['selectedRepoIds'],
    properties: {
      selectedRepoIds: { type: 'array', items: { type: 'integer' } },
    },
  },
};

export const updateSkillsSchema = {
  tags: ['Portfolio'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['skills'],
    properties: {
      skills: { type: 'array', items: { type: 'string' } },
    },
  },
};

export const updateTemplateSchema = {
  tags: ['Portfolio'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['selectedTemplate'],
    properties: {
      selectedTemplate: { 
        type: 'string', 
        enum: ['minimal', 'developer', 'creative', 'saas', 'brutalist', 'dominic', 'vanshika', 'folioblox', 'futuristic'] 
      },
    },
  },
};

export const getPortfolioSchema = {
  tags: ['Portfolio'],
  security: [{ bearerAuth: [] }],
};

export const getExportSchema = {
  tags: ['Portfolio'],
  security: [{ bearerAuth: [] }],
};
