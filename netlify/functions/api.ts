import serverless from "serverless-http";
import { createApiApp } from "../../src/server/api";

const app = createApiApp();

export const handler = serverless(app);
