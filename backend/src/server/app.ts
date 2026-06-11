import "dotenv/config";
import express from "express";
import { authRouter }      from "./routes/auth";
import { meRouter }        from "./routes/me";
import { invertersRouter } from "./routes/inverters";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth",      authRouter);
app.use("/inverters", invertersRouter);
app.use("/",          meRouter);

// Generic error handler — never leak stack traces.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
