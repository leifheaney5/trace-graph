import { seedArtifacts, seedRelations, validateBundle } from "./model";
import type { AuditRecord, ProjectBundle } from "./model";

export interface ProjectRepository {
  load(): ProjectBundle;
  save(bundle: ProjectBundle): void;
  clear(): void;
  listAudit(): AuditRecord[];
  recordAudit(record: AuditRecord): void;
}

export class BrowserProjectRepository implements ProjectRepository {
  private readonly projectKey = "tg-project";
  private readonly auditKey = "tg-audit";
  private readonly databaseName = "tracegraph-local";
  private readonly databaseVersion = 1;

  private openDatabase(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === "undefined") return Promise.resolve(null);
    return new Promise((resolve) => {
      const request = indexedDB.open(this.databaseName, this.databaseVersion);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("project"))
          database.createObjectStore("project");
        if (!database.objectStoreNames.contains("audit"))
          database.createObjectStore("audit");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
  }

  async hydrate(): Promise<ProjectBundle | null> {
    const database = await this.openDatabase();
    if (!database) return null;
    return new Promise((resolve) => {
      const request = database
        .transaction("project", "readonly")
        .objectStore("project")
        .get("current");
      request.onsuccess = () => {
        try {
          resolve(request.result ? validateBundle(request.result) : null);
        } catch {
          resolve(null);
        }
        database.close();
      };
      request.onerror = () => {
        resolve(null);
        database.close();
      };
    });
  }

  load(): ProjectBundle {
    try {
      const current = localStorage.getItem(this.projectKey);
      if (current) return validateBundle(JSON.parse(current));
      const legacy = validateBundle({
        version: 1,
        artifacts:
          JSON.parse(localStorage.getItem("tg-artifacts") || "null") ||
          seedArtifacts,
        relations:
          JSON.parse(localStorage.getItem("tg-relations") || "null") ||
          seedRelations,
      });
      this.save(legacy);
      return legacy;
    } catch {
      return { version: 1, artifacts: seedArtifacts, relations: seedRelations };
    }
  }

  save(bundle: ProjectBundle) {
    localStorage.setItem(this.projectKey, JSON.stringify(bundle));
    // Keep the legacy keys for one migration cycle so older guest workspaces remain readable.
    localStorage.setItem("tg-artifacts", JSON.stringify(bundle.artifacts));
    localStorage.setItem("tg-relations", JSON.stringify(bundle.relations));
    void this.openDatabase().then((database) => {
      if (!database) return;
      const transaction = database.transaction("project", "readwrite");
      transaction.objectStore("project").put(bundle, "current");
      transaction.oncomplete = () => database.close();
      transaction.onerror = () => database.close();
    });
  }

  clear() {
    localStorage.removeItem(this.projectKey);
    localStorage.removeItem(this.auditKey);
    localStorage.removeItem("tg-artifacts");
    localStorage.removeItem("tg-relations");
    localStorage.removeItem("tg-baselines");
    localStorage.removeItem("tg-diagram-perspective");
    if (typeof indexedDB !== "undefined") {
      indexedDB.deleteDatabase(this.databaseName);
    }
  }

  listAudit() {
    try {
      const value = JSON.parse(localStorage.getItem(this.auditKey) || "[]");
      return Array.isArray(value) ? (value as AuditRecord[]) : [];
    } catch {
      return [];
    }
  }

  recordAudit(record: AuditRecord) {
    const next = [...this.listAudit(), record].slice(-100);
    localStorage.setItem(this.auditKey, JSON.stringify(next));
    void this.openDatabase().then((database) => {
      if (!database) return;
      const transaction = database.transaction("audit", "readwrite");
      transaction.objectStore("audit").put(next, "records");
      transaction.oncomplete = () => database.close();
      transaction.onerror = () => database.close();
    });
  }
}
