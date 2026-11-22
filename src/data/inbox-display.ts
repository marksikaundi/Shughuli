export type InboxLayout = 'list' | 'board' | 'calendar';
export type InboxGrouping = 'none' | 'date' | 'priority';
export type InboxSorting = 'manual' | 'date' | 'name' | 'priority';
export type InboxSpan = 'all' | 'today' | 'week' | 'overdue';
export type InboxPriorityFilter = 'all' | 'high' | 'medium' | 'low';
export type InboxFeedback = 'checkmark' | 'none';

export type InboxDisplay = {
  layout: InboxLayout;
  showCompleted: boolean;
  feedback: InboxFeedback;
  grouping: InboxGrouping;
  sorting: InboxSorting;
  date: InboxSpan;
  deadline: InboxSpan;
  priority: InboxPriorityFilter;
};

export const defaultInboxDisplay: InboxDisplay = {
  layout: 'list',
  showCompleted: false,
  feedback: 'checkmark',
  grouping: 'none',
  sorting: 'manual',
  date: 'all',
  deadline: 'all',
  priority: 'all',
};
