export type UserRole = 'SUPER' | 'HSE' | 'CHEF_EQUIPE' | 'AGENT_QUART' | 'TECHNICIEN' | 'AGENT_POLYVALENT';

export interface User {
  id?: number;
  name: string;
  role: UserRole;
  title: string;
  password?: string;
}

export interface Equipment {
  id?: number;
  name: string;
  description: string;
}

export type OTStatus = 'OUVERT' | 'EN_COURS' | 'TERMINE' | 'ANNULE';

export interface OT {
  id?: number;
  title: string;
  description: string;
  equipmentId: number;
  createdById: number;
  assignedToId?: number;
  status: OTStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ATStatus = 'BROUILLON' | 'ATTENTE_MAINTENANCE' | 'ATTENTE_HSE' | 'ATTENTE_SUPER' | 'AUTORISE' | 'TERMINE' | 'REJETE';

export interface AT {
  id?: number;
  otId: number;
  createdById: number;
  maintenanceValidatorId?: number;
  hseValidatorId?: number;
  superValidatorId?: number;
  status: ATStatus;
  risks: string[];
  measures: string[];
  isConsigned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Consignation {
  id?: number;
  atId: number;
  steps: ConsignationStep[];
  initiatedById: number;
  validatedById?: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsignationStep {
  id: string;
  description: string;
  isDone: boolean;
  doneById?: number;
  doneAt?: Date;
}
