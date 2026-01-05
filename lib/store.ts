import { create } from 'zustand';
import { SessionStore, WorkflowStep } from './types';

const initialState = {
  currentStep: 1 as WorkflowStep,
  historicalTopic: null,
  research: null,
  outline: null,
  script: null,
  scenes: [],
  storyboardScenes: [],
  // War Room recursive state
  tacticalResearch: null,
  recursiveScript: null,
  recursiveProgress: null,
  // YouTube repurposing state
  repurposeSession: null,
  // Workflow state
  isGenerating: false,
  errors: [],
  sceneGenerationProgress: 0,
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setHistoricalTopic: (topic) => set({ historicalTopic: topic }),

  setResearch: (research) => set({ research }),

  setOutline: (outline) => set({ outline }),

  setScript: (script) => set({ script }),

  setScenes: (scenes) => set({ scenes }),

  setStoryboardScenes: (scenes) => set({ storyboardScenes: scenes }),

  updateStoryboardScene: (sceneNumber, updates) =>
    set((state) => ({
      storyboardScenes: state.storyboardScenes.map((scene) =>
        scene.scene_number === sceneNumber ? { ...scene, ...updates } : scene
      ),
    })),

  setStep: (step) => set({ currentStep: step }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setSceneGenerationProgress: (progress) => set({ sceneGenerationProgress: progress }),

  addError: (error) =>
    set((state) => ({
      errors: [...state.errors, error],
    })),

  clearErrors: () => set({ errors: [] }),

  reset: () => set(initialState),

  // War Room actions
  setTacticalResearch: (research) => set({ tacticalResearch: research }),

  setRecursiveScript: (script) => set({ recursiveScript: script }),

  setRecursiveProgress: (progress) => set({ recursiveProgress: progress }),

  // Repurpose actions
  setRepurposeSession: (session) => set({ repurposeSession: session }),

  updateRepurposeSession: (updates) =>
    set((state) => ({
      repurposeSession: state.repurposeSession
        ? { ...state.repurposeSession, ...updates }
        : null,
    })),
}));
