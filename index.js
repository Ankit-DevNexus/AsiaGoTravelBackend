import dotenv from "dotenv";
dotenv.config();

import express from "express";

import cors from 'cors';
import mongoose from "mongoose";
import  Routes  from "./Routes/routes.js";
import bodyParser from "body-parser";

const PORT = process.env.PORT || 3005;
const uri = process.env.MONGO_URL;

const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api', Routes);

// for testing
app.get("/", (req, res) => {
    res.send("AsiaGoTravel");
});

// mongodb connection
app.listen(PORT, () => {
    console.log("App Started");
    mongoose.connect(uri)
    .then(() => {
        console.log("✅ DB Connected Successfully");
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Failed:", err.message);
    });
});