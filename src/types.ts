export interface DemoOwner {
  id: string;
  name: string;
  email: string;
}

export interface Demo {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  icon: string;
  visibility: 'public' | 'private';
  owner: DemoOwner;
  clickCount: number;
  notes: string;
  unavailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  userId: string;
  pinnedDemoIds: string[];
  sortField: 'alphabetical' | 'clickCount' | 'lastUsed';
  sortDirection: 'asc' | 'desc';
  lastClicked: Record<string, string>;
}

export interface AuthUser {
  userId: string;
  userDetails: string;
  userRoles: string[];
  claims: Array<{ typ: string; val: string }>;
}

export type SortField = UserPreferences['sortField'];
export type SortDirection = UserPreferences['sortDirection'];
