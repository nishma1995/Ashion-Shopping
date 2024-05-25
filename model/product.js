const mongo = require("mongoose");
const dotenv = require("dotenv");
const Category = require("../model/category");
dotenv.config({ path: "./configuration.env" });



const productSchema = new mongo.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: mongo.Schema.Types.ObjectId,
    ref: 'Category',
    required:true
  },
  sizeDetails: [
    {
        size: {
            type: String,
            required: true,
        },
        colorQuantities: [
            {
                color: {
                    type: String,
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
],
  price: {
    type: Number,
    required: true,
  },
  
  description: {
    type: String,
    required: true,
  },

  created_at: {
    type: Date,
    default: Date.now(),
  },
  status: {
    type: Boolean,
    default: true,
  },
  image: {
   
    paths: [String]
  },
  deleted: {
    type: Boolean,
    default: false,
},
maxQuantityPerPerson: {
  type: Number,
  required: true,
  default: 6// Default maximum quantity allowed per person
},

offerRate: { type: Number }
});
const product = new mongo.model("product", productSchema);

module.exports = product;
