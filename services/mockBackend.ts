import { Project, TimesheetEntry, User, UserRole } from '../types';

// In-memory simulated database
const MOCK_USERS: User[] = [
  { id: '1', name: 'Alice Admin', email: 'alice@neo.com', role: UserRole.ADMIN, avatarUrl: 'https://picsum.photos/200/200' },
  { id: '2', name: 'Bob Builder', email: 'bob@neo.com', role: UserRole.EMPLOYEE, avatarUrl: 'https://picsum.photos/201/201' },
];

let projects: Project[] = [
  { id: '101', name: 'Alpha Website Redesign', description: 'Complete overhaul of corporate website', status: 'IN_PROGRESS', dueDate: '2023-12-31', teamSize: 5 },
  { id: '102', name: 'Beta Mobile App', description: 'iOS and Android native apps', status: 'PLANNING', dueDate: '2024-03-15', teamSize: 3 },
  { id: '103', name: 'Internal Audit', description: 'Q4 Financial audit', status: 'COMPLETED', dueDate: '2023-10-01', teamSize: 2 },
];

let timesheets: TimesheetEntry[] = [
  { id: 't1', userId: '2', projectId: '101', date: '2023-10-24', hours: 8, description: 'Frontend development', status: 'APPROVED' },
  { id: 't2', userId: '2', projectId: '101', date: '2023-10-25', hours: 7.5, description: 'API Integration', status: 'PENDING' },
  { id: 't3', userId: '1', projectId: '103', date: '2023-10-24', hours: 4, description: 'Reviewing docs', status: 'APPROVED' },
];

// Helper for delays to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Auth APIs ---
export const login = async (email: string): Promise<User> => {
  await delay(800);
  const user = MOCK_USERS.find(u => u.email === email);
  if (user) {
    localStorage.setItem('neo_user_id', user.id);
    return user;
  }
  throw new Error('Invalid credentials');
};

export const getCurrentUser = async (): Promise<User> => {
  await delay(200);
  const userId = localStorage.getItem('neo_user_id');
  const user = MOCK_USERS.find(u => u.id === userId);
  if (user) return user;
  throw new Error('Not logged in');
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem('neo_user_id');
};

// --- Project APIs ---
export const getProjects = async (): Promise<Project[]> => {
  await delay(500);
  return [...projects];
};

export const createProject = async (project: Omit<Project, 'id'>): Promise<Project> => {
  await delay(600);
  const newProject: Project = { ...project, id: Math.random().toString(36).substr(2, 9) };
  projects = [newProject, ...projects];
  return newProject;
};

// --- Timesheet APIs ---
export const getTimesheets = async (userId?: string): Promise<TimesheetEntry[]> => {
  await delay(500);
  if (userId) {
    return timesheets.filter(t => t.userId === userId);
  }
  return [...timesheets];
};

export const createTimesheetEntry = async (entry: Omit<TimesheetEntry, 'id' | 'status'>): Promise<TimesheetEntry> => {
  await delay(400);
  const newEntry: TimesheetEntry = { 
    ...entry, 
    id: Math.random().toString(36).substr(2, 9),
    status: 'PENDING'
  };
  timesheets = [newEntry, ...timesheets];
  return newEntry;
};