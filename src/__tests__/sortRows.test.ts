import type { SortableRow } from "../sortRows";
import { sortRows } from "../sortRows";
import type { ConfigRow } from "../types";

describe("sortRows", () => {
  const projectEnvId1 = 1;
  const projectEnvId2 = 2;

  it("should sort rows with matching projectEnvId first", () => {
    const rows: SortableRow[] = [
      { project_env_id: projectEnvId2 },
      { project_env_id: projectEnvId1 },
    ];

    const result = sortRows(rows, projectEnvId1);

    expect(result).toEqual([
      { project_env_id: projectEnvId1 },
      { project_env_id: projectEnvId2 },
    ]);
  });

  it("should keep the original order for non-matching rows", () => {
    const rows: SortableRow[] = [
      { project_env_id: projectEnvId1 },
      { project_env_id: projectEnvId2 },
    ];

    const result = sortRows(rows, 3);

    expect(result).toEqual(rows);
  });

  it("should handle rows with missing projectEnvId", () => {
    const rows: SortableRow[] = [
      { project_env_id: projectEnvId1 },
      {},
      { project_env_id: projectEnvId2 },
    ];

    const result = sortRows(rows, projectEnvId1);

    expect(result).toEqual([
      { project_env_id: projectEnvId1 },
      {},
      { project_env_id: projectEnvId2 },
    ]);
  });

  it("should handle an empty array", () => {
    const rows: ConfigRow[] = [];

    const result = sortRows(rows, projectEnvId1);

    expect(result).toEqual([]);
  });
});
