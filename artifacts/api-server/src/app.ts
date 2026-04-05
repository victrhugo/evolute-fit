import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
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
// Raw body for Stripe webhook (must come before express.json)
app.use("/api/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Apple Pay domain verification — required for Apple Pay to work on your domain.
// Set the APPLE_PAY_DOMAIN_ASSOCIATION env var with the file content from:
// Stripe Dashboard → Settings → Payment methods → Apple Pay → Add domain
app.get("/.well-known/apple-developer-merchantid-domain-association", (req, res) => {
  const fileContent = process.env.APPLE_PAY_DOMAIN_ASSOCIATION;
  if (!fileContent) {
    res.status(404).send("Apple Pay domain association file not configured.");
    return;
  }
  res.setHeader("Content-Type", "text/plain");
  res.send(fileContent);
});

export default app;
