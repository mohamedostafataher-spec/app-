import { getIdToken } from "firebase/auth";
import { auth } from "./firebase";

// In this integrated setup, our server is on the same origin (port 3000)
const API_URL = ""; 

async function authHeaders() {
  if (!auth.currentUser) return {};
  const token = await getIdToken(auth.currentUser);
  return { Authorization: `Bearer ${token}` };
}

/**
 * Creates and runs a full analysis task on the integrated backend
 */
export async function runFullAnalysis(args: {
  projectId: string;
  datasetId: string;
  stationId: string;
  records: any[];
  analysisType?: string;
  parameters?: any;
}) {
  const headers = (await authHeaders()) as Record<string, string>;
  
  const response = await fetch(`${API_URL}/api/analysis/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(args),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "فشل معالجة التحليل على الخادم");
  }

  return response.json();
}

/**
 * Health check
 */
export async function checkHealth() {
  const response = await fetch(`${API_URL}/health`);
  return response.json();
}
