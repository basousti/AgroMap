import { Request, Response } from "express";
const userService = require("../services/UserS");

async function getUsers(req: Request, res: Response) {
    try {
         
        const users = await userService.getUsers();
        console.log("Extracted Data from MongoDB:", users);
        res.json(users);
    } catch (error) {
        console.error("Error Fetching Data:", error);
        res.status(500).json({ message: "Server Error" });
    } 
}
module.exports = { getUsers };


// use an async function when you need to handle asynchronous operations, such as:
    // - Fetching data from an API
    // - Reading from a database
    // - Waiting for a delay (timeouts)
    // - File system operations
    // - Interacting with an external service


    //await userService.getUsers(); ensures that users contains the actual retrieved data, not a  Promise { <pending> }
        //Promise : asynchronous operation has started but hasn't completed yet
        //async function : is a function that always returns a Promise
        //when you call an async function use await or you return a promise
