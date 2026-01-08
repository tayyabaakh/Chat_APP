// DB connection setup
const mongoose=require('mongoose');

const connectDb=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,{
           
        })
        console.log("Db connected successfully");
    }
    catch(error){
        console.log("error connecting Db",error.message);
        process.exit(1);
    }
}
module.exports=  connectDb;