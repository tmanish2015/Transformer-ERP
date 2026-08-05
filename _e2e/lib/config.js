import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const CONFIG = {
  appUrl: process.env.E2E_APP_URL || 'https://transformer-erp.vercel.app',
  email: process.env.E2E_EMAIL || 'tmanish2015@gmail.com',
  password: process.env.E2E_PASSWORD || '12345678',
  supabaseUrl: 'https://lggadrvsbqmiwwathyzb.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZ2FkcnZzYnFtaXd3YXRoeXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NDA1NzcsImV4cCI6MjEwMTAxNjU3N30.ZmAoLYQ8A48TloWM65AoNrM397W_ntnpLlSg89xMNHU',
  chromePath: process.env.E2E_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: process.env.E2E_HEADLESS !== 'false',
  viewport: { width: 1440, height: 900 },
  resultsDir: path.resolve(__dirname, '../results'),
  screenshotsDir: path.resolve(__dirname, '../screenshots'),
  timeout: 20000,
}

export const RESULTS_ROOT = {
  summary: {},
  phases: [],
}

