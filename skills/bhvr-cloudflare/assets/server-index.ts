import { Hono } from "hono";

type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Env }>();

// API Routes
const api = new Hono<{ Bindings: Env }>();

api.get("/hello", (c) => c.json({ message: "Hello from bhvr API" }));

// Mount API under /api
app.route("/api", api);

// Better-Auth routes (add after setting up auth)
// import { createAuth } from "./auth";
// const auth = createAuth(env);
// app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export default app;
