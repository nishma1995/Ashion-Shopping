const mongoose=require('mongoose')
const addressSchema=new mongoose.Schema
(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"user"
        },
        address_type:String,
        firstname:String,
        lastname:String,
        email: {
            type: String,
          },
          phonenumber: {
            type: String,
          },
          pincode: {
            type: Number,
          },
      
          address: {
            type: String,
          },
          city: {
            type: String,
          },
          state: {
            type: String,
          },
          landmark: {
            type: String,
          },
    },
        { timestamps: true }
 );
const address=mongoose.model("address",addressSchema)
module.exports=address