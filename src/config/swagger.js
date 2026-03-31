const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Secure API Platform",
      version: "1.0.0",
      description:
        "A secure REST API built with Node.js, Express, PostgreSQL, JWT authentication, and deployed on Azure.",
    },
    servers: [
      {
        url: "https://secureapi-edwar-2026.azurewebsites.net",
        description: "Production server",
      },
      {
        url: "http://localhost:3000",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;