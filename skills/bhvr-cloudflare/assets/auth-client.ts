import { createAuthClient } from "better-auth/react";

// Single origin configuration - use relative path
export const authClient = createAuthClient({
  baseURL: "/api/auth"
});
