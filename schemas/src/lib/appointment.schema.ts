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

export const AppointmentConfirmSchema = {
  type: 'object',
  properties: {
    user: { type: 'string' },
    id: { type: 'string' },
  },
  required: ['user', 'id'],
} as const;

export const AppointmentRejectSchema = {
  type: 'object',
  properties: {
    user: { type: 'string' },
    id: { type: 'string' },
  },
  required: ['user', 'id'],
} as const;
