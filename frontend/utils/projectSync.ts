type SyncStage = {
  id: number | string;
  stage_name: string;
  status: string;
  completion_date?: string | null;
  evidence_urls?: string[];
  updated_by?: string;
  updated_at?: string;
};

type SyncState = {
  stages: SyncStage[];
  activity: Array<{ id: string; message: string; type: string; timestamp: string }>;
  lastUpdated: string | null;
  projectStatus: string;
};

function getProjectSyncKey(projectId: string | null) {
  return projectId ? `astrobuilds_shared_progress_${projectId}` : null;
}

function parseStoredState<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getSharedProjectState(projectId: string | null): SyncState {
  if (typeof window === "undefined") {
    return { stages: [], activity: [], lastUpdated: null, projectStatus: "In Progress" };
  }

  const key = getProjectSyncKey(projectId);
  const stored = parseStoredState<SyncState>(key ? localStorage.getItem(key) : null);

  return {
    stages: Array.isArray(stored?.stages) ? stored.stages : [],
    activity: Array.isArray(stored?.activity) ? stored.activity : [],
    lastUpdated: stored?.lastUpdated ?? null,
    projectStatus: stored?.projectStatus ?? "In Progress"
  };
}

export function saveSharedProjectState(projectId: string | null, state: Partial<SyncState>) {
  if (typeof window === "undefined" || !projectId) return;

  const key = getProjectSyncKey(projectId);
  if (!key) return;

  const existing = getSharedProjectState(projectId);
  const nextState = {
    ...existing,
    ...state,
    stages: Array.isArray(state.stages) ? state.stages : existing.stages,
    activity: Array.isArray(state.activity) ? state.activity : existing.activity,
    lastUpdated: state.lastUpdated ?? new Date().toISOString(),
    projectStatus: state.projectStatus ?? existing.projectStatus
  };

  localStorage.setItem(key, JSON.stringify(nextState));
}

export function syncSharedStageUpdate(projectId: string | null, stage: SyncStage, actorRole: string) {
  if (!projectId) return;

  const existing = getSharedProjectState(projectId);
  const updatedStages = existing.stages.some((item) => item.id === stage.id)
    ? existing.stages.map((item) => (item.id === stage.id ? stage : item))
    : [...existing.stages, stage];

  const activity = [
    {
      id: `${Date.now()}`,
      message: `${actorRole} updated ${stage.stage_name} to ${stage.status}`,
      type: "stage-update",
      timestamp: new Date().toISOString()
    },
    ...existing.activity.slice(0, 4)
  ];

  saveSharedProjectState(projectId, {
    stages: updatedStages,
    activity,
    projectStatus: stage.status === "Completed" ? "In Progress" : "In Progress"
  });
}

export function getSharedProgressPercent(projectId: string | null) {
  const state = getSharedProjectState(projectId);
  if (!state.stages.length) return 0;

  const completed = state.stages.filter((stage) => stage.status === "Completed").length;
  return Math.round((completed / state.stages.length) * 100);
}
