import "./envSetup";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ADMIN_PATHNAME } from "./adminPath";

const app = express();

const SITE_PROTECTED = process.env.SITE_PROTECTED === "true";
const SITE_USER = process.env.SITE_USER || "lizaz";
const SITE_PASSWORD = process.env.SITE_PASSWORD;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

if (SITE_PROTECTED) {
  app.use((req, res, next) => {
    if (!SITE_PASSWORD) {
      res.status(500).send("SITE_PASSWORD is not set. Copy .env.example to .env and set a password.");
      return;
    }

    const header = req.headers.authorization;
    if (!header?.startsWith("Basic ")) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Lizaz"');
      res.status(401).send("Authentication required");
      return;
    }

    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator === -1) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Lizaz"');
      res.status(401).send("Authentication required");
      return;
    }

    const user = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    if (user !== SITE_USER || password !== SITE_PASSWORD) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Lizaz"');
      res.status(401).send("Authentication required");
      return;
    }

    next();
  });
}

app.use((req, res, next) => {
  const start = Date.now();
  const pathName = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: unknown, ...args: unknown[]) {
    capturedJsonResponse = bodyJson as Record<string, unknown>;
    return originalResJson(bodyJson, ...(args as []));
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathName.startsWith("/api")) {
      let logLine = `${req.method} ${pathName} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    log(`CMS panel (keep private): http://localhost:${port}${ADMIN_PATHNAME}`);
    if (!process.env.ADMIN_PATH) {
      log("Tip: set ADMIN_PATH in .env to customize the secret URL");
    }
    if (SITE_PROTECTED) {
      log(`Protected — login with username: ${SITE_USER}`);
    }
  });
})();
