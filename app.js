const express = require('express');
const app = express();
const path = require('path');
const hbs =require('hbs')
const dotenv = require("dotenv");
dotenv.config({ path: "./configuration.env" });
const session = require("express-session");
const methodOverride = require("method-override");
const errorHandler=require('./middleware/errorHandler')
const passportSetup=require('./configs/passport-setup')
const passport=require('passport')

const userRoute=require("./routes/user")
const adminRoute=require("./routes/admin")



app.use(require("./middleware/cacheControl"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 },
  })
);

app.use(passport.initialize())
app.use(passport.session())


app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));


app.use(methodOverride("_method"));


app.use("/",userRoute);
app.use("/admin",adminRoute);
//  app.get('/order', (req, res) => {
  
//    res.render("user/orderSuccess")
//  });


hbs.registerPartials("views/partials");
hbs.registerPartials("views/partials");
hbs.registerPartials("views/partials");
hbs.registerPartials("views/partials");
hbs.registerPartials("views/partials");
hbs.registerPartials("views/partials");

// app.use((req,res,next)=>{
//   const error=new Error('oops..invalid route')
//   console.log(error)
//   error.statusCode=404
//   next(error)

// })


// Define the helper function
hbs.registerHelper('addOne', function(index) {
    // Add 1 to the index and return
    return index + 1;
});
hbs.registerHelper('encodeURI', function(uri) {
  return encodeURIComponent(uri);
});

hbs.handlebars.registerHelper('eq', function(arg1, arg2, options) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

hbs.registerHelper('calculatePersatage',function(value1,value2){ 
  console.log(value1+'  '+value2) 
  let persantage=parseInt(value1) 
  let amount=parseInt(value2) 
  if(isNaN(value1)||isNaN(value2)){ 
    return '' 
  } 
  const sample=persantage/100 
  const discount=sample*amount 
  const preResult=value2-discount 
  const result=Math.floor(preResult) 
  return result 
})
hbs.registerHelper('if_eq', function (a, b, opts) {
  // Perform a case-insensitive comparison
  if (a && b && a.toString().toLowerCase() === b.toString().toLowerCase()) {
      return opts.fn(this); // Values are equal, execute the true block
  } else {
      return opts.inverse(this); // Values are not equal, execute the false block
  }
});
hbs.registerHelper('@first', function(index, options) {
  if (index === 0) {
      return options.fn(this);
  } else {
      return options.inverse(this);
  }
});



// Register a helper to check if a string contains another string
hbs.registerHelper('contains', (haystack, needle) => {
  return haystack.includes(needle);
});


app.use(errorHandler)

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
