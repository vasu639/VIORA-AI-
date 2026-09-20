import express from "express";
import path from "path";
import { createApiApp } from "./src/server/api";

const PORT = 3000;

export { createApiApp };

export async function startServer() {
  const app = createApiApp();

  // Vite middleware for local development only
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Viora AI server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start the HTTP listener if executed directly (not when imported as a serverless function)
if (
  process.env.NETLIFY !== "true" &&
  !process.env.AWS_LAMBDA_FUNCTION_NAME &&
  !process.env.LAMBDA_TASK_ROOT
) {
  startServer();
}
