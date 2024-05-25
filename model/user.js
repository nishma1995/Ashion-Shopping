const mongo=require('mongoose')
const dotenv=require('dotenv')
dotenv.config({ path: "./configuration.env" });
const db=process.env.DB_STRING

mongo.connect(db).then(() => {
  console.log("Connected to MongoDB");
})
.catch((error) => {
  console.error("MongoDB connection error:", error);
});

const userschema=new mongo.Schema({
    firstname:{
      
        type:String,
        required:true
    },
    lastname:{
        type:String,
    
    },
    email: {
        type: String,
        required: true,
      },
      phonenumber: {
        type: String,
       
      },
      password: {
        type: String,
       
      },
      created_at: {
        type: Date,
        default: Date.now(),
      },
      googleId:{
        type:String
      },
      status: {
        type: Boolean,
        default: false,
      },
      deleted: {
        type: Boolean,
        default: false,
    }
})
const user=new mongo.model('users',userschema)
module.exports=user
