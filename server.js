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

const allowedOrigins = [
  "https://panom-kaidit.github.io",
  "https://karibu-gl.netlify.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

const corsOptions = {
  // Validate the request Origin before adding CORS headers.
  origin: (origin, callback) => {
    // Allow non-browser tools (like curl/Postman) that may not send Origin.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  // Allowed HTTP methods for cross-origin requests.
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Allowed request headers sent by the frontend.
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  // Return 204 for successful preflight response.
  optionsSuccessStatus: 204
};

// Apply CORS middleware to all routes.
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

const seedDirector = require(path.join(__dirname, "src", "utils", "seedDirector"));
seedDirector();
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
