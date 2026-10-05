/**
 * API Client for Extreme Rainfall Platform
 * Communication layer between React Frontend and Python FastAPI Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface AnalysisRequest {
  analysis_name: string;
  station_id?: string;
  parameters?: Record<string, any>;
  records?: any[];
}

export interface UnifiedAnalysisResponse {
  analysis_run_id: string;
  analysis_name: string;
  station_id: string;
  status: 'completed' | 'failed' | 'processing';
  results?: any[];
  warnings?: string[];
}

/**
 * Persists parsed records to the integrated backend
 */
export async function saveAnalysisToBackend(filename: string, records: any[]) {
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, records }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'فشل حفظ البيانات في القاعدة');
  }

  return response.json();
}

/**
 * Triggers analysis on the backend
 */
export async function triggerAnalysis(module: string, records: any[], stationId?: string) {
  const response = await fetch(`${API_BASE_URL}/api/analysis/${module}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records, station_id: stationId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `فشل تحليل ${module}`);
  }

  return response.json() as Promise<UnifiedAnalysisResponse>;
}

/**
 * Health check for the backend service
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
