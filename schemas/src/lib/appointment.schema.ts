export const AppointmentSchema = {
  type: 'object',
  properties: {
    user_id: { type: 'string' },
    start: { type: 'string' },
    duration: { type: 'string' },
    participants: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['user_id', 'start', 'duration', 'participants'],
} as const;
