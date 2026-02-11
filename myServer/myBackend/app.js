import express from "express";
import morgan from "morgan";
import cors from "cors";
import dataBaseConfig from "./dataBase.js";

const app = express();

dataBaseConfig();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.listen(2000, () => {
  console.log("Server running on port 2000");
});
