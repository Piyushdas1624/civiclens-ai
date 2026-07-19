import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export async function fetchIssues() {
  // Stub: fetch issues from backend
}

export async function submitIssue(data) {
  // Stub: submit issue to backend
}

export async function fetchOperationsData() {
  // Stub: fetch operations data from backend
}

export async function fetchSafetyMetrics() {
  // Stub: fetch safety metrics from backend
}

export async function analyzeWithAI(input) {
  // Stub: send data to AI service for analysis
}

export default apiClient
