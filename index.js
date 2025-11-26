import dotenv from "dotenv";
dotenv.config();

import express from "express";

import cors from "cors";
import mongoose from "mongoose";
import Routes from "./Routes/routes.js";
import bodyParser from "body-parser";

const PORT = process.env.PORT || 3005;
const uri = process.env.MONGO_URL;

const app = express();

// app.use(cors());

// CORS CONFIG
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",

  "http://194.238.18.1",

  "http://ghardekhoapna.com",
  "https://ghardekhoapna.com",
  "http://www.ghardekhoapna.com",
  "https://www.ghardekhoapna.com",

  "http://dashboard.ghardekhoapna.com",
  "https://dashboard.ghardekhoapna.com",
  "http://www.dashboard.ghardekhoapna.com",
  "https://www.dashboard.ghardekhoapna.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api", Routes);

// for testing
app.get("/", (req, res) => {
  res.send("AsiaGoTravel");
});

// mongodb connection

mongoose
  .connect(uri)
  .then(() => {
    console.log("DB Connected Successfully");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err.message);
  });
