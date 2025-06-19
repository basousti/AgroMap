import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const signupRoute= require("./routes/signupR");
const loginRoute = require("./routes/loginR");
const userRoute = require("./routes/UserR");
const bodyParser = require("body-parser");
const createAdmin = require("./script/admin");
const ForgetPw = require("./ConfigPassword/Route");
const Status = require("./routes/RequestR");
const Profile =require("./routes/ProfileR");
const UpdatProfile = require("./routes/updateProfile");

import farmerRoutes from './routes/farmerRoutes';
import parcelRoutes from './routes/parcelleRoutes';
// Middleware "use" permet de traiter le requeste it's like "Every time someone visits, do this first!"
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
 
createAdmin(); 

app.use("/user", signupRoute);
app.use("/auth",loginRoute);
app.use("/api",userRoute);
app.use("/Verif",ForgetPw);
app.use("/Request",Status);
app.use("/api/user",Profile);
app.use("/api/user",UpdatProfile)

app.use('/api/farmers', farmerRoutes);
app.use('/api/parcelles', parcelRoutes);

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello, TypeScript with Express!" });
});

// ✅ Vérification de la santé de l'API
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "AgroMap API est en fonctionnement",
    timestamp: new Date(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime()
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


