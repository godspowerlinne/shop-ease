const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/database");
const config = require("./config/dotEnvConfig");
const authRoute = require("./routes/authRoute")
const swaggerSetup = require("./config/swagger");


const app = express();

app.use(
    cors({
        origin: "*", // Allow requests from any origin
        Credentials: true,
    })
);

app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests, please try again later.",
});

app.use("/shopease/auth", limiter, authRoute); // Apply rate limiting to auth routes

swaggerSetup(app); // Initialize Swagger

const startServer = async () => {
    try {
        await connectDB();
        app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();

module.exports = app;
