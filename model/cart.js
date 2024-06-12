const mongoose = require("mongoose")
const User = require("../model/user");
const Product = require("../model/product");
const cartSchema = new mongoose.Schema
  ({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
    },
    quantity: {
      type: Number,
      default:1
      
    },
    color: {
      type: String,
      default:'Red'
      
    },
    size: {
      type: String,
      default:'S'
      
    },
 
    stock:{type:Number}
  })

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;