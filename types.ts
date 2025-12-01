export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  dueDate: string;
  teamSize: number;
}

export interface TimesheetEntry {
  id: string;
  userId: string;
  projectId: string;
  date: string;
  hours: number;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export enum View {
  DASHBOARD = 'Dashboard',
  PROJECTS = 'Projects',
  TIMESHEETS = 'Timesheets'
}

export interface ChartData {
  name: string;
  value: number;
}