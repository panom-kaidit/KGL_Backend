const swaggerJsdoc = require("swagger-jsdoc");
require("dotenv").config()

const port = process.env.PORT;
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "KGL API",
      version: "1.0.0",
      description: "API documentation for KGL procurement and sales system"
    },
    servers: [
      {
        url: `http://localhost:${port}`
      }
    ]
  },
  apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;