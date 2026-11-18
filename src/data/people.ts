export const PEOPLE = {
  olivia: { initials: 'OR', color: '#E8B08A', text: '#5C3317' },
  amira: { initials: 'AM', color: '#C9B6F4', text: '#3E2A6E' },
  jules: { initials: 'JK', color: '#F5A8C6', text: '#6B2346' },
  leo: { initials: 'LS', color: '#8ED0C2', text: '#134E44' },
  noah: { initials: 'ND', color: '#F3D48A', text: '#5A4308' },
} as const;

export type PersonId = keyof typeof PEOPLE;
