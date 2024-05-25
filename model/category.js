const mongo = require("mongoose");

const categorySchema = new mongo.Schema({
 
    name: 
    {
        type:String,
        unique:true,
        required:true
    
    },
    description: 
    {type:String,
    required:true},
    image: {
        path: String,
        filename: String,
       
       
    },
    deleted: {
        type: Boolean,
        default: false,
    } });
   



const Category = mongo.model("Category",categorySchema);
module.exports = Category;
