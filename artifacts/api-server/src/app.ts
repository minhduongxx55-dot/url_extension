import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", router);

// Serve React dashboard from the same Express service.
// After `pnpm run build`, Vite outputs files to artifacts/dashboard/dist/public.
const dashboardDist = path.resolve(
  process.cwd(),
  "artifacts/dashboard/dist/public",
);
const dashboardIndex = path.join(dashboardDist, "index.html");

if (existsSync(dashboardIndex)) {
  app.use(express.static(dashboardDist));

  // SPA fallback: keep /api/* as API, return dashboard for every non-API route.
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(dashboardIndex);
  });
} else {
  app.get("/", (_req, res) => {
    res.status(200).json({
      status: "ok",
      message:
        "API is running, but dashboard build was not found. Run `pnpm run build` before production start.",
      health: "/api/healthz",
    });
  });
}

// JSON 404 for API only. Dashboard fallback above handles non-API routes.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

export default app;
