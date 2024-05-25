
const mongoose = require('mongoose');
const user = require("../model/user");

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
      productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
    }],
    products: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
          },
          size:{
            type:String},
          quantity: {
            type: Number,
          
          },
          color: {
            type: String,
          },
          productStatus:{
            type:String,
            default:"pending"
          },
          // requestCancellation:
          // {
          //   type:String,
          //   default:"No requests"
          // }
          returnReason:{
            type:String
          },
          productPrice:{
            type:Number
          }
        }
      ],
    addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
      },
    paymentMethod: {
        type: String,
        required: true
    },
   
      amount: {
        type: Number,
        required: true
    },
    orderedDate: {
        type: Date,
        default: Date.now
    },
    couponId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupon",
      required: false
    },
    paymentStatus:{
      type:String
    }
   
    
    
    // status: {
    //     type: String,
    //     enum: ['placed','pending', 'processing', 'shipped', 'delivered'], // Example status values, customize as needed
    //     default: 'placed'
    // },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
