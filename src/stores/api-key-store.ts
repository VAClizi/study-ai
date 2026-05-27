import { create } from "zustand"

export type LLMModel = "deepseek-chat" | "deepseek-reasoner"

interface APIKeyState {
  apiKey: string | null
  model: LLMModel
  isConfigured: boolean
  setApiKey: (key: string) => void
  setModel: (model: LLMModel) => void
  clearApiKey: () => void
}

const API_KEY_STORAGE = "studyai-api-key"
const MODEL_STORAGE = "studyai-model"

function getStoredKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(API_KEY_STORAGE)
}

function getStoredModel(): LLMModel {
  if (typeof window === "undefined") return "deepseek-chat"
  const stored = localStorage.getItem(MODEL_STORAGE)
  if (stored === "deepseek-chat" || stored === "deepseek-reasoner") return stored
  return "deepseek-chat"
}

export const useAPIKeyStore = create<APIKeyState>((set) => ({
  apiKey: getStoredKey(),
  model: getStoredModel(),
  isConfigured: !!getStoredKey(),

  setApiKey: (key) => {
    localStorage.setItem(API_KEY_STORAGE, key)
    set({ apiKey: key, isConfigured: !!key })
  },

  setModel: (model) => {
    localStorage.setItem(MODEL_STORAGE, model)
    set({ model })
  },

  clearApiKey: () => {
    localStorage.removeItem(API_KEY_STORAGE)
    set({ apiKey: null, isConfigured: false })
  },
}))
