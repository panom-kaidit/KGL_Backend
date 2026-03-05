const path = require("path");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

require("dotenv").config();

const REQUIRED_ENV = ["PORT", "JWT_SECRET", "KGL_DB"];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`FATAL: Environment variable "${key}" is not set. Aborting.`);
    process.exit(1);
  }
});

const app = express();

const explicitAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

const devOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const isAllowedOrigin = (origin) =>
  explicitAllowedOrigins.includes(origin) || devOriginPattern.test(origin);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.use(express.json());

const connectDb = require(path.join(__dirname, "src", "config", "db_Connect"));
connectDb();

const swaggerSpec = require("./src/config/swagger");
const procurementRoutes = require(path.join(__dirname, "src", "routes", "procurementRoutes"));
const salesRoutes = require(path.join(__dirname, "src", "routes", "salesRoutes"));
const userRoutes = require(path.join(__dirname, "src", "routes", "userRoutes"));
const statisticsRoutes = require(path.join(__dirname, "src", "routes", "statisticsRoutes"));
const inventoryRoutes = require(path.join(__dirname, "src", "routes", "inventoryRoutes"));
const creditRoutes = require(path.join(__dirname, "src", "routes", "creditRoutes"));
const pricingRoutes = require(path.join(__dirname, "src", "routes", "pricingRoutes"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/procurement", procurementRoutes);
app.use("/sales", salesRoutes);
app.use("/users", userRoutes);
app.use("/api/manager", statisticsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/credits", creditRoutes);
app.use("/api/pricing", pricingRoutes);

app.use((err, req, res, next) => {
  console.error("[Unhandled error]", err.stack || err.message);
  res.status(500).json({ message: "Internal server error" });
});

const port = process.env.PORT;
app.listen(port, (err) => {
  if (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
  console.log(`Listening on port ${port}`);
});
