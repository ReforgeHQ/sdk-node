import type { ProjectEnvId } from "./types";

export interface SortableRow {
  project_env_id?: ProjectEnvId;
}

// sort so that the rows matching our projectEnvId are first
export const sortRows = <T extends SortableRow>(
  rows: T[],
  projectEnvId: ProjectEnvId
): T[] => {
  return rows.sort((a, b) => {
    const aMatches = a.project_env_id === projectEnvId;
    const bMatches = b.project_env_id === projectEnvId;

    if (aMatches && !bMatches) {
      return -1;
    } else if (!aMatches && bMatches) {
      return 1;
    } else {
      return 0;
    }
  });
};
