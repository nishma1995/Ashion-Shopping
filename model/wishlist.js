const mongoose=require('mongoose')
const user = require("../model/user");
const product = require("../model/product");
const wishlistSchema=new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      products: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
          },
          price: {
            type: Number,
            default: 0,
          },
          size:{
            type: String,
            default: "S",

          },
          color:{
            type: String,
            default: "Red"
          },
          quantity:
          { 
            type: Number,
            default: 1,

          }
        },
      ],
      addedAt: {
        type: Date,
        default: Date.now
    }
})
const wishlist=mongoose.model('wishlist',wishlistSchema)
module.exports=wishlist