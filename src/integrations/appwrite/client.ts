import { Client, Health } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  throw new Error("Appwrite is not configured. Set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID.");
}

export const appwriteClient = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

const appwriteHealth = new Health(appwriteClient);
let healthCheck: Promise<unknown> | undefined;

/** Runs the Appwrite SDK health check at most once per page load. */
export function pingAppwrite(): Promise<unknown> {
  if (!healthCheck) {
    healthCheck = appwriteHealth.get().then(
      (result) => {
        console.info("[appwrite] health check succeeded");
        return result;
      },
      (error: unknown) => {
        healthCheck = undefined;
        console.error("[appwrite] health check failed", error instanceof Error ? error.message : "Unknown error");
        throw error;
      },
    );
  }
  return healthCheck;
}
