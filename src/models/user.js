const mongoose=require("mongoose");
const Schema= new mongoose.Schema({
    name:{
        type:String,
        
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
    ,
    onboarding:{
        type:Boolean,
        default:false,
    }


    

    

});
const User=mongoose.model("User",Schema);
module.exports=User;