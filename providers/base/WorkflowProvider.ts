// providers/base/WorkflowProvider.ts
export interface WorkflowInput {
  name: string;
  description?: string;
  triggers: any[];
  actions: any[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  provider: string;
  status: "draft" | "published" | "active" | "inactive";
  triggers: any[];
  actions: any[];
  owner: string;
  collaborators: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "success" | "failed";
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

export enum Role {
  OWNER = "owner",
  EDITOR = "editor",
  VIEWER = "viewer",
}

export interface WorkflowProvider {
  createWorkflow(input: WorkflowInput): Promise<Workflow>;
  updateWorkflow(id: string, input: WorkflowInput): Promise<Workflow>;
  publishWorkflow(id: string): Promise<void>;
  deactivateWorkflow(id: string): Promise<void>;
  deleteWorkflow(id: string): Promise<void>;
  listWorkflows(org: string): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow>;
  listExecutions(workflowId: string): Promise<WorkflowExecution[]>;
  shareWorkflow(id: string, collaborator: string, role: Role): Promise<void>;
  transferOwnership(id: string, userId: string): Promise<void>;
}
