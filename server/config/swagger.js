const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger definition
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Shop - Ease Backend",
      version: "1.0.0",
      description:
        "API documentation for my holiday assignment named Shop - Ease. This API allows users to register, login, and manage their profiles.",
      contact: {
        name: "Godspower Richard",
        email: "godspowerandhim@gmail.com",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = (app) => {
  // Serve Swagger UI
  app.use("/shopease/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};