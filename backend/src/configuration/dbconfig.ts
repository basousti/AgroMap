const mongo=require("mongoose");

mongo.connect("mongodb://localhost:27017/test")
 mongo.connection.on("connected",() =>{
    console.log("connected to MongoDB \n")
 });

mongo.connection.on("error",(err: any)=>{
    console.log(`error connecting to MongoDB \n:${err}`)
 });

module.exports= mongo;
 