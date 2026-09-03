const express=require("express");
require("dotenv").config();
const connectToDatabase=require("./config/db");
const cookieParser=require("cookie-parser");
const cors=require("cors");
const apiRouter=require("./routes/index");
const port=process.env.PORT || 5000;
const app=express();
app.use(cors({
  origin: "http://localhost:5173", // Your frontend URL
  credentials: true, // Allow cookies
  allowedHeaders: ["Content-Type", "Authorization"] // <--- YOU MUST ADD THIS
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("uploads"));
app.use(cookieParser());

app.use('/api',apiRouter);
app.use("/health",(req,res)=>{res.send("server is up and running ")});
app.listen(port,async (req,res)=>{
   await connectToDatabase();
    
    console.log("server is listing on port :",port);
});
