export const IsAutoSchema = {
  type: 'object',
  properties: {
    isAuto: { type: 'boolean' },
  },
  required: ['isAuto'],
} as const;
