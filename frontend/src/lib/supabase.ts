import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

declare global {
  interface Window {
    /**
     * Injected synchronously by the Electron preload script (desktop/preload.js) before
     * this bundle loads, so one installer can point at the deployed Supabase project
     * without rebuilding the frontend. Absent in the plain browser/dev build, where
     * Vite's compile-time env vars are used instead.
     */
    __TRANSFORMER_ERP_CONFIG__?: { supabaseUrl: string; supabaseAnonKey: string }
  }
}

const runtimeConfig = typeof window !== 'undefined' ? window.__TRANSFORMER_ERP_CONFIG__ : undefined
const supabaseUrl = runtimeConfig?.supabaseUrl ?? import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = runtimeConfig?.supabaseAnonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY

const REMEMBER_ME_KEY = 'txf-remember-me'

/**
 * "Remember me" toggles whether the session survives a browser restart.
 * Checked -> localStorage (persists). Unchecked -> sessionStorage (cleared on tab close).
 * The preference itself always lives in localStorage so it's readable before any session exists.
 */
function getActiveStorage(): Storage {
  return localStorage.getItem(REMEMBER_ME_KEY) === 'false' ? sessionStorage : localStorage
}

export function setRememberMePreference(remember: boolean) {
  localStorage.setItem(REMEMBER_ME_KEY, String(remember))
}

const rememberAwareStorage = {
  getItem: (key: string) => getActiveStorage().getItem(key),
  setItem: (key: string, value: string) => getActiveStorage().setItem(key, value),
  removeItem: (key: string) => getActiveStorage().removeItem(key),
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: rememberAwareStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
