const mongoose = require("mongoose");

const offerSchema = mongoose.Schema({

    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    rate: {
        type: Number,
        required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    status:
    {
        type:Boolean,
        default:true
    }
});

const offer= mongoose.model('offer', offerSchema);
module.exports = offer;