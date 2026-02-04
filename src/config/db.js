const mongoose=require("mongoose");
const dotenv=require("dotenv");
dotenv.config();
module .exports=async function connectToDatabase() {
await mongoose.connect(process.env.MONGODB_URI);
console.log("data base connected suucessfully");

}