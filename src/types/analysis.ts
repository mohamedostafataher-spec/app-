export interface AnalysisRun {
  runId: string;
  projectId: string;
  datasetId: string;
  stationId?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  analysisType: string;
  parameters: any;
  results?: any;
  warnings: string[];
  createdAt: any;
  completedAt?: any;
}

export interface Dataset {
  id: string;
  fileName: string;
  storagePath: string;
  status: string;
  createdAt: any;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  title: string;
  language: string;
  createdAt: any;
}
