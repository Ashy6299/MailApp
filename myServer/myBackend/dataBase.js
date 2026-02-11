import mongoose from "mongoose";
const databaseconnection = "mongodb://127.0.0.1:27017/MY SERVER";

const dataBaseConfig = () =>
  mongoose
    .connect(databaseconnection, {
      connectTimeoutMS: 60000,
      serverSelectionTimeoutMS: 60000,
    })
    .then(() => console.log("Connected to Database"))
    .catch((e) => {
      console.log(new Error(e).message);
      console.log("Cannot connect to Database at this time");
    });
export default dataBaseConfig;
