
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({

  code: {
    type: String,
    required: true,
  },


  discountAmount: {
    type: Number,
    required: true
},
minPurchaseAmount: {
  type: Number,
},

validUntil: {
    type: Date,
    required: true
},
maxUses: {
    type: Number,
    default: 1 
},
usedCount: {
    type: Number,
    default: 0 
},
users: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],
},
{ timestamps: true }

);

const coupon= mongoose.model('coupon', couponSchema);
module.exports = coupon;