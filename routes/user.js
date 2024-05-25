const express=require('express')
const router=express.Router()

const user=require('../controller/user')
const cart=require('../controller/cart')
const product=require('../model/product')
const isUserAuthenticated=require('../middleware/userAuthentication')
const UserAuthenticated=require('../middleware/isUserAuthenticated')
const passport=require('passport')


router.get('/',user.getLanding)
router.get('/register',UserAuthenticated,user. get_register)
//router.post('/register',user.post_register);
router.post('/register',UserAuthenticated,user.sentOtp);
router.get('/enterotp',user.getOtppage);
router.post('/enterotp',UserAuthenticated,user.createUser);
router.post('/resendotp/:email',user.resendOtp);

router.get('/login',UserAuthenticated,user.get_login);
router.post('/login',UserAuthenticated,user.post_login);

//forgotPassword
router.get('/forgotPassword',user.emailForm);
router.post('/sendOtp',user.forgotSentOtp)
router.get('/forgotEnterotp',user.forgotEnterotp);
router.post('/forgotenterotp',user.checkOtp);
router.get('/forgotChangePassword',user.forgotChangePasswordPage)
router.put("/forgotChangePassword",user.forgotchangePassword)

// //logout
// router.get("/logout",(req,res)=>{
//   //handle with passport
//   res.send("logging out")
// })
// const authcheck=(req,res,next)=>{
//    if(!req.user){
//       console.log("checkcheck"+req.user)
//    res.redirect('/login')
//    }else{
//    next()
//    }
//    }

//auth with google

//  router.get('/google',passport.authenticate('google',{
//     scope:['profile','email']
// })
//  )

// // Callback route for Google to redirect to after authentication
// router.get('/google/redirect',authcheck, passport.authenticate('google'), (req, res) => {
//     // Redirect the user after successful authentication
//     res.redirect('/');
//   });
// async(req,res)=>
// {
//    console.log("eeeeeee"+req.user)
//    const productdata=await product.find({deleted:false}).sort({createdAt:-1}).limit(9)
//   // res.redirect('/',req.user)
//   res.render('index',{User:req.user.firstname,productdata})
//}
//)

//category
router.get("/all",user.all)
router.get("/women",user.women)
router.get("/men",user.men)
router.get("/kids",user.kids)
router.get("/accessories",user.accessories)
router.get("/category",user.categories)

//productdetails
router.get("/productdetails/:id",user.product_details)

router.get("/myprofile",isUserAuthenticated,user.myProfile)
router.post("/editProfile",isUserAuthenticated,user.editProfilePage)
router.put("/editProfile",isUserAuthenticated,user.editProfile)
router.get("/changepassword",isUserAuthenticated,user.changepasswordPage)
router.put("/changepassword",isUserAuthenticated,user.changepassword)
router.get('/addresses',isUserAuthenticated,user.addressPage)
router.get('/addAddress',isUserAuthenticated,user.addAddressPage)
router.post('/addAddress',isUserAuthenticated,user.addAddress)
router.get('/editAddress/:id',isUserAuthenticated,user.editAddressPage)
router.put('/editAddress/:id',isUserAuthenticated,user.editAddress)
router.delete('/deleteAddress/:id',isUserAuthenticated,user.deleteAddress)

router.post("/addtoCart",cart.addtocart)
router.get("/cart",isUserAuthenticated,cart.cartPage)
router.put("/updatecart/:productId",isUserAuthenticated,cart.updatecart)
router.delete("/remove",isUserAuthenticated,cart.remove)

router.post("/availability",isUserAuthenticated,user.availability)
router.get("/sort/priceLowToHigh",isUserAuthenticated,user.lowToHigh)
router.get("/sort/priceHighToLow",isUserAuthenticated,user.HighToLow)

router.get('/checkout',isUserAuthenticated,user.checkout)
router.post('/placeOrder',isUserAuthenticated,user.placeorder)
router.post('/createRazorpayOrder',isUserAuthenticated,user.createRazorpayOrder)
router.post('/isOrderCompleted',isUserAuthenticated,user.isOrderCompleted)
router.get('/orderSuccess',isUserAuthenticated,user.ordersuccess)
router.post('/orderFailure',isUserAuthenticated,user.orderFailure)
router.get('/orderFailurePage/:id',isUserAuthenticated,user.orderFailurePage)
router.post('/placeOrderFailure',isUserAuthenticated,user.placeorderFailure)
router.get('/myorder',isUserAuthenticated,user.myorder)
router.get('/orderDetails/:id',isUserAuthenticated,user.orderDetails)
router.get('/download-invoice/:id',isUserAuthenticated,user.downloadInvoice)

router.post('/cancelOrder',isUserAuthenticated,user.cancelorder)
router.post('/returnOrder',isUserAuthenticated,user.returnOrder)

router.get('/wishlist',isUserAuthenticated,user.wishlistPage)
router.post('/addToWishlist',isUserAuthenticated,user.addToWishlist)
router.delete('/removeFromWishlist',isUserAuthenticated,user.removeFromWishlist)
router.post('/addtoCartfromWishlist',isUserAuthenticated,user.addtoCartfromWishlist)

router.get('/search',user.search)

router.get('/wallet',isUserAuthenticated,user.walletPage)

router.post('/checkCoupon',isUserAuthenticated,user.checkCoupon)
router.get('/couponlist',isUserAuthenticated,user.couponlist)


router.get('/logout',user.logout)




module.exports=router