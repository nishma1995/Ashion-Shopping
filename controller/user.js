const user = require("../model/user")
const OTP = require('../model/otp');
const product = require('../model/product')
const category = require('../model/category')
const Address = require("../model/address")
const order = require("../model/order")
const cart = require("../model/cart")
const wishlist = require("../model/wishlist")
const wallet = require("../model/wallet")
const coupon = require("../model/coupon")
const bcrypt = require("bcrypt")
const mongoose = require('mongoose')
const otpGenerator = require('otp-generator');
const easyinvoice = require('easyinvoice');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const dotenv = require("dotenv");
dotenv.config({ path: "./configuration.env" });

const Razorpay = require("razorpay");
const { v4: uuidv4 } = require('uuid');

const razorpay = new Razorpay({
  key_id: process.env.RAZOR_PAY_ID,
  key_secret: process.env.RAZOR_PAY_SECRET_KEY
});

let data
let email
let otp


const getLanding = async (req, res) => {
  let User = req.session.user;
  googleUser = req.user ? req.user.firstname : '';
  const productdata = await product.find({ deleted: false }).sort({ created_at: -1 }).limit(9)
  res.render("index", { User, productdata, googleUser });
}
const get_register = (req, res) => {
  res.render("user/register")
}

const getOtppage = (req, res) => {
  res.render("otp/otpcheck")
}

const sentOtp = async (req, res, next) => {
  try {
    data = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      phonenumber: req.body.number,
      password: req.body.password
    }
    email = req.body.email

    const check = await user.findOne({ email: req.body.email })
    if (check) {
      return res.render("user/register", { error: "Email already exists" })
    }
    else {
      //generate otp

      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false, specialChars: false
      })
    }
    let result = await OTP.findOne({ otp: otp })
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
      result = await OTP.findOne({ otp: otp });
    }


    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);
    console.log(otp + email)
    res.render('otp/otpcheck', { email })

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }

}
const resendOtp = async (req, res, next) => {

  try {
    const otp = await otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const email = req.params.email;

    const userData = { email, otp };
    await OTP.create(userData);
    res.render("otp/otpcheck");
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

const createUser = async (req, res, next) => {
  try {
    const enteredOtp = req.body.otp;
    const otpData = await OTP.findOne({ email, otp: enteredOtp });
    if (otpData) {
      // OTP is correct, you can now store 'data' in the user collection
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newUser = await user.create({
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        phonenumber: data.phonenumber,
        password: hashedPassword,
      });

      // Remove the used OTP from the OTPModel
      await OTP.findOneAndDelete({ email, otp: enteredOtp });


      const walletData = { userId: newUser._id, balance: 0 };
      const wallets = await wallet.create(walletData);


      res.json({ success: true, redirectUrl: "/login" });
    } else {


      res.status(400).json({ success: false, error: "Incorrect OTP" });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }


}

const get_login = async (req, res, next) => {
  res.render("user/login");
}
const post_login = async (req, res, next) => {

  try {
    const check = await user.findOne({ email: req.body.email });
    if (check) {
      if (check.status) {
        res.render("user/login", { error: "Your account is blocked." })
      }
      else if (!check.status) {

        const deHashed = await bcrypt.compare(req.body.password, check.password);

        if (deHashed) {
          req.session.user = check.firstname
          req.session.email = check.email
          req.session.userId = check._id
          req.session.isUserAuthenticated = true

          res.redirect("/");
        } else {
          res.render("user/login", { error: "incorrect password" });
        }
      }
    }
    else {
      res.render("user/login", { error: "user not found" });
    }



  } catch (error) {
    if (error.name === 'MongooseTimeoutError') {
      console.error("error", error);
    }

  }


}

//forgot password
const emailForm = async (req, res) => {
  res.render('forgotPassword/emailForm')
}

const forgotSentOtp = async (req, res) => {
  try {
    const email = req.body.email

    const check = await user.findOne({ email: req.body.email })

    if (!check) {
      return res.json({ success: false, message: "Email not exists" });
    }
    else {
      //generate otp

      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false, specialChars: false
      })
    }
    let result = await OTP.findOne({ otp: otp })
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
      result = await OTP.findOne({ otp: otp });
    }


    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);

    // Send JSON response
    res.json({ success: true, email: email });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const forgotEnterotp = async (req, res) => {
  res.render('forgotPassword/forgotEnterotp')

}

const checkOtp = async (req, res) => {
  try {
    const enteredOtp = req.body.otp;
    const email = req.body.email;

    const otpData = await OTP.findOne({ email, otp: enteredOtp });
    if (!otpData) {
      return res.json({ success: false, message: 'Invalid OTP' });
    }


    return res.json({ success: true });
  }
  catch (error) {
    console.log(error)

  }

}

const forgotChangePasswordPage = async (req, res) => {
  res.render('forgotPassword/forgotChangePassword')
}

const forgotchangePassword = async (req, res) => {


  const { newPassword, confirmPassword, email } = req.body


  try {
    const users = await user.findOne({ email: email })

    if (newPassword != confirmPassword) {
      res.render('forgotPassword/forgotChangePassword', { error: "Password doesnot matches" })
    }

    const hashedpassword = await bcrypt.hash(newPassword, 10)
    await user.findOneAndUpdate({ email: email }, { password: hashedpassword });
    res.render('user/login', { message: "Password Updated successfully" })
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }

}



const all = async (req, res) => {
  try {

    const data = await product.find({ deleted: false }).limit(9)
    const categoryData = await category.find()
    res.render("shop", { data, categoryData })

  }
  catch (error) {

  }
}
const women = async (req, res) => {
  try {
    const data = await product.find({ category: "women" })
    res.render("/shop", { data })
  }
  catch (error) {

  }
}


const men = async (req, res) => {
  try {
    const data = await product.find({ category: "men" })
    res.render("/shop", { data })
  }
  catch (error) {

  }
}


const kids = async (req, res) => {
  try {
    const data = await product.find({ category: "kids" })
    res.render("/shop", { data })
  }
  catch (error) {

  }
}

const accessories = async (req, res) => {
  try {
    const data = await product.find({ category: "accessories" })
    res.render("/shop", { data })
  }
  catch (error) {

  }
}

const categories = async (req, res) => {
  try {

    let User = req.session.user;

    const categoryData = await category.find({ deleted: false });

    const sort = req.query.category;
    const pageNum = parseInt(req.query.pageNum) || 1;
    const pageSize = 6;
    const skip = (pageNum - 1) * pageSize;
    const limit = pageSize;

    const data = await product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $match: {
          "categoryDetails.name": sort,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);
    const countData = await product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $match: {
          "categoryDetails.name": sort,
        },
      },
      {
        $count: "totalCount",
      },
    ]);

    const totalCount = countData.length > 0 ? countData[0].totalCount : 0;


    const totalPages = Math.ceil(totalCount / pageSize);





    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }


    res.render("shop", { data, categoryData, User, pages, sort });
  } catch (error) {
    console.error("Error in categories route:", error);
    res.status(500).send("Internal Server Error");
  }
}

const product_details = async (req, res) => {
  try {
    let User = req.session.user;
    const id = req.params.id

    const data = await product.findOne({ _id: id, deleted: false })
    const categoryId = data.category
    const sizedetails = data.sizeDetails


    const filteredSizeDetails = sizedetails.map(sizedetail => {
      const filteredColorQuantities = sizedetail.colorQuantities.filter(colorQty => colorQty.quantity > 0);
      return {
        size: sizedetail.size,
        availableColors: filteredColorQuantities.map(colorQty => {
          return {
            color: colorQty.color,
            quantity: colorQty.quantity
          };
        })
      };
    });
    let sizedetailsJSON = JSON.stringify(filteredSizeDetails);


    relatedData = await product.find({ category: categoryId }).limit(3)

    res.render("productdetails", { data, relatedData, sizedetails: filteredSizeDetails, User, sizedetailsJSON })

  }
  catch (error) {
    console.log(error)

  }

}
const myProfile = async (req, res) => {
  const id = req.session.userId

  const profiledetails = await user.findOne({ _id: id })

  res.render("user/profile", { profiledetails })

}

const editProfilePage = async (req, res) => {
  const id = req.session.userId
  const details = await user.findOne({ _id: id })

  res.render("user/editprofile", { details })
}



const editProfile = async (req, res) => {
  try {
    const id = req.session.userId


    const { firstname, lastname, email, phonenumber } = req.body

    await user.findByIdAndUpdate(id, {
      firstname: firstname,
      lastname: lastname,
      email: email,
      phonenumber: phonenumber
    })
    res.redirect("/myprofile")
  }
  catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }


}


const logout = (req, res) => {
  delete req.session.isUserAuthenticated
  req.session.destroy(err => {
    if (err) {
      console.error("Error destroying session:", err);
    }
  })
  res.clearCookie('connect.sid'); // Clear session cookie
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate');
  res.redirect("/login")

}

const changepasswordPage = async (req, res) => {
  const id = req.session.userId

  res.render("user/changepassword")
}
const changepassword = async (req, res) => {

  const { currentPassword, newPassword, confirmPassword } = req.body
  const id = req.session.userId
  try {
    const users = await user.findOne({ _id: id })

    const isPasswordValid = await bcrypt.compare(currentPassword, users.password)
    if (!isPasswordValid) {
      res.render("user/changepassword", { error: "Current password is incorrect" })
    }
    else if (newPassword != confirmPassword) {
      res.render("user/changepassword", { error: "Password doesnot matches" })
    }


    const hashedpassword = await bcrypt.hash(newPassword, 10)
    await user.findByIdAndUpdate(id, { password: hashedpassword })

    res.render("user/changepassword", { message: "Password Updated successfully" })
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }

}
const addressPage = async (req, res) => {
  try {
    const id = req.session.userId


    const details = await Address.find({ userId: id })

    // details.forEach(details => {
    //   d.fullAddress =
    //     `${address.firstname} ${address.lastname},
    //   ${address.email}, ${address.phonenumber}, ${address.address}, ${address.city},
    //   ${address.state}, ${address.pincode}, ${address.landmark}`;
    // })



    res.render("user/addresses", { details })
  }
  catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

const addAddressPage = async (req, res) => {
  res.render("user/addAddress")

}
const addAddress = async (req, res) => {
  try {
    const id = req.session.userId
    const
      { firstname,
        lastname,
        email,
        phonenumber,
        addresstype,
        address,
        city,
        pincode,
        state,
        landmark } = req.body

    await Address.create({
      userId: id,
      firstname: firstname,
      lastname: lastname,
      email: email,
      phonenumber: phonenumber,
      address_type: addresstype,
      address: address,
      city: city,
      pincode: pincode,
      state: state,
      landmark: landmark
    })

    res.status(200).json({ success: true, message: 'Address added successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: error.message });
  }


}

const editAddressPage = async (req, res) => {

  const id = req.params.id
  const details = await Address.findOne({ _id: id })
  res.render("user/editAddress", { details })


}
const editAddress = async (req, res) => {
  try {

    const id = req.params.id

    const
      { firstname,
        lastname,
        email,
        phonenumber,
        addresstype,
        address,
        city,
        pincode,
        state,
        landmark } = req.body
    await Address.findByIdAndUpdate(id, {
      userId: req.session.userId,
      firstname: firstname,
      lastname: lastname,
      email: email,
      phonenumber: phonenumber,
      address_type: addresstype,
      address: address,
      city: city,
      pincode: pincode,
      state: state,
      landmark: landmark
    })
    res.redirect("/addresses")
  }
  catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

const deleteAddress = async (req, res) => {
  const { id } = req.params;

  try {

    const address = await Address.findById(id);

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }


    await Address.findByIdAndDelete(id);

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Server error' });
  }

}
const availability = async (req, res) => {
  try {

    let User = req.session.user;
    const categoryId = req.body.category || req.query.category;
    const categoryData = await category.find();

    const pageNum = parseInt(req.query.pageNum) || parseInt(req.body.pageNum);
    const pageSize = 6;
    const skip = (pageNum - 1) * pageSize;
    const limit = pageSize;
    const filterApplied = req.body.filter || req.query.filter;

    let totalCount;
    let totalPages;
    let filterCondition = {};
    let sortCondition = {};

    if (filterApplied === "all") {
      totalCount = await product.countDocuments({});
      filterCondition = {};
    } else if (filterApplied === "in_stock") {
      totalCount = await product.countDocuments({ status: true, category: categoryId });
      filterCondition = { status: true, category: categoryId };
    } else if (filterApplied === "out_of_stock") {
      totalCount = await product.countDocuments({ status: false, category: categoryId });
      filterCondition = { status: false, category: categoryId };
    } else if (filterApplied === "low_to_high") {
      totalCount = await product.countDocuments({ category: categoryId });
      filterCondition = { category: categoryId };
      sortCondition = { price: 1 };
    } else if (filterApplied === "high_to_low") {
      totalCount = await product.countDocuments({ category: categoryId });
      filterCondition = { category: categoryId };
      sortCondition = { price: -1 };
    } else if (filterApplied === "atoz") {
      totalCount = await product.countDocuments({ category: categoryId });
      filterCondition = { category: categoryId };
      sortCondition = { name: 1 };
    } else if (filterApplied === "ztoa") {
      totalCount = await product.countDocuments({ category: categoryId });
      filterCondition = { category: categoryId };
      sortCondition = { name: -1 };
    } else if (filterApplied === "newarrival") {
      totalCount = await product.countDocuments({ category: categoryId });
      filterCondition = { category: categoryId };
      sortCondition = { createdAt: -1 };
    }

    totalPages = Math.ceil(totalCount / pageSize);
    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    const data = await product.find(filterCondition).sort(sortCondition).skip(skip).limit(limit);

    res.render("shop", { data, categoryData, User, pages, filterApplied, pageNum });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const lowToHigh = async (req, res) => {


  const categoryData = await category.find()
  const data = await product.find().sort({ price: 1 })
  res.render("shop", { data, categoryData });
}
const HighToLow = async (req, res) => {
  const categoryData = await category.find()
  const data = await product.find().sort({ price: -1 })
  res.render("shop", { data, categoryData });

}


const checkout = async (req, res) => {
  try {
    const deliverycharge = 60
    const id = req.session.userId
    let User = req.session.user;
    const razorpaykey = process.env.RAZOR_PAY_ID
    const address = await Address.find({ userId: id })
    const cartData = await cart.find({ userId: id })

    const productIds = cartData.map(item => item.productId)

    const products = await product.find({ _id: { $in: productIds } })

    const cartWithProducts = cartData.map(item => {
      const product = products.find(product => product._id.equals(item.productId));
      return {
        name: product.name,
        price: product.price,
        totalprice: item.totalprice,
        quantity: item.quantity,
        color: item.color

      };
    });
    const subtotal = cartWithProducts.reduce((total, item) => total + item.totalprice, 0)
    const total = subtotal + deliverycharge
    res.render("user/checkOut", { address, cartWithProducts, subtotal, productIds, User, deliverycharge, total, razorpaykey })
  } catch (error) {
    console.error("Error fetching cart data:", error);

    res.status(500).send("Internal Server Error");
  }

}

const placeorder = async (req, res) => {
  try {

    const userId = req.session.userId
    //const { selectedAddressId, paymentmethod, productIds, amount, totalAmount,totalAmountInput ,couponIdInput} = req.body
    const { selectedAddressId, paymentmethod, productIds, totalAmountInput, couponIdInput } = req.body




    const productIdsArray = productIds.split(',').map(productId => new mongoose.Types.ObjectId(productId.trim()));

    const cartItems = await cart.find({ productId: { $in: productIdsArray }, userId: userId });

    const productsDetails = [];
    for (const item of cartItems) {

      const productDetail = {
        productId: item.productId,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        productPrice: item.price,
        productStatus: "pending"

      };
      productsDetails.push(productDetail);
    }
    if ((paymentmethod == 'cash-on-delivery') && (totalAmountInput > 1000)) {

      const message = "Cash  on delivery is not available for order greater than amount 1000"
      return res.redirect('/checkOut?error=' + encodeURIComponent(message))
    }


    const newOrder = new order({
      userId: userId,
      addressId: selectedAddressId,
      paymentMethod: paymentmethod,
      amount: totalAmountInput,
      productIds: productIdsArray,
      products: productsDetails,
      orderedDate: new Date(),
      paymentStatus: 'pending',


    });
    if (couponIdInput && mongoose.Types.ObjectId.isValid(couponIdInput)) {
      newOrder.couponId = couponIdInput;
    }

    if (paymentmethod === 'wallet') {

      const userWallet = await wallet.findOne({ userId });

      if (userWallet.balance < totalAmountInput) {
        const message = "Insufficient balance: " + userWallet.balance
        return res.redirect('/checkOut?error=' + encodeURIComponent(message))
      }

      userWallet.balance -= totalAmountInput;
      userWallet.transactions.push({
        transactionType: 'debit',
        amount: totalAmountInput,
        transactionDate: new Date(),
        creditedDate: new Date(),
        description: 'debited from order',
      });
      await userWallet.save();

      newOrder.paymentStatus = 'paid';
    } else if (paymentmethod === 'razorpay') {

      newOrder.paymentStatus = 'paid';
    } else if (paymentmethod === 'cashondelivery') {

      newOrder.paymentStatus = 'cashondelivery';
    } else {
      newOrder.paymentStatus = 'failed';
    }



    await newOrder.save()

    const cartItemsToRemove = await cart.deleteMany({ productId: { $in: productIdsArray }, userId: userId });

    res.redirect('/orderSuccess');
  }
  catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Failed to place order', error: error.message });
  }
}

const createRazorpayOrder = async (req, res) => {
  try {
    const { productIds, amount, couponId } = req.body;

    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: uuidv4(),
      payment_capture: 1,
      notes: {
        couponId: couponId
      },
    };
    const razorpaykey = process.env.RAZOR_PAY_ID;


    const order = await razorpay.orders.create(options);
    if (!order) {
      throw new Error('Failed to create Razorpay order');
    }

    res.status(200).json({ orderId: order.id, amount: options.amount / 100, key: razorpaykey });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Failed to create Razorpay order', error: error.message });
  }
};

const isOrderCompleted = (req, res) => {
  const paymentStatus = req.body.status;
  razorpay.payments.fetch(req.body.razorpay_payment_id).then((paymentdocument) => {
  }
  )

  if (paymentdocument.Status === 'captured') {
    res.redirect('/orderSuccess');
  } else {
    res.redirect('/orderfailure');
  }
}






const myorder = async (req, res) => {

  try {
    const status = ""
    const userId = req.session.userId
    const orderdetails = await order.find({ userId: userId }).sort({ _id: -1 }).populate({ path: 'couponId', model: "coupon", }).exec();

    orderdetails.forEach((order) => {

      order.formattedDate = new Date(order.orderedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      });

    });

    for (const order of orderdetails) {



      const productDetails = [];
      for (const prodcts of order.products) {
        const products = await product.findById(prodcts.productId);
        if (products) {
          const productStatus = prodcts.productStatus
          products.productStatus = productStatus;
          productDetails.push(products);
        }
      }

      order.productDetails = productDetails;



    }

    const orderDetailsJSON = JSON.stringify(orderdetails);
    res.render("user/myOrder", { orderdetails, orderDetailsJSON })
  }
  catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Failed to place order', error: error.message });
  }
}


const orderDetails = async (req, res) => {
  const id = req.params.id
  const orderDetails = await order.findById(id).populate('products.productId')


  const orderDetailsArray = [orderDetails];
  const orderDetailsJSON = JSON.stringify(orderDetailsArray);
  res.render('user/orderDetails', { orderDetails, orderDetailsJSON })

}
const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orders = await order.findById(orderId).populate({ path: 'addressId', model: "address" }).populate('products.productId').populate({ path: "couponId", model: "coupon" }).exec();

    let discount
    if (orders.couponId) {
      discount = orders.couponId.discountAmount
    }
    console.log(discount)
    const deliveryCharge = 60;

    const totalAmount = orders.amount
    const invoiceData = {
      currency: 'INR',
      sender: {
        company: 'Ashion',
        address: '123 Main Street',
        city: 'Ernakulam',
        state: 'KERALA',
        postalCode: '10001',
        country: 'INDIA',
        phone: '+1-234-567-8901',
        email: 'info@ashion.com',
        website: 'www.ashion.com',
        logo: path.join(__dirname, '..', 'public', 'img', 'logo.png')
      },
      client: {
        company: `${orders.addressId.firstname} ${orders.addressId.lastname}`,
        email: orders.addressId.email,
        phoneNumber: orders.addressId.phonenumber,
        address: `${orders.addressId.address}, ${orders.addressId.city}, ${orders.addressId.state} ${orders.addressId.pincode}`
      },
      invoiceNumber: 'INV-123',
      invoiceDate: new Date().toDateString(),
      products: orders.products.map(order => ({
        description: order.productId.name,
        quantity: order.quantity,
        size: order.size,
        color: order.color,
        price: order.productPrice
      })),
      deliveryCharge: deliveryCharge,
      discount: discount,
      totalAmount: totalAmount,
      PaidAmount: orders.amount,
      bottomNotice: 'Amount received'
    };

    const doc = new PDFDocument({ margin: 25 });

    const stream = fs.createWriteStream(path.join(__dirname, '..', 'public', 'invoice.pdf'));
    doc.pipe(stream);

    // Add logo
    if (fs.existsSync(invoiceData.sender.logo)) {
      doc.image(invoiceData.sender.logo, 50, 45, { width: 50 }).moveDown();
    } else {
      console.error('Logo file does not exist at path:', invoiceData.sender.logo);
    }

    // Add company information
    doc.fontSize(10).text(invoiceData.sender.company, 200, 50, { align: 'right' });
    doc.text(invoiceData.sender.address, 200, 65, { align: 'right' });
    doc.text(`${invoiceData.sender.city}, ${invoiceData.sender.state} ${invoiceData.sender.postalCode}`, 200, 80, { align: 'right' });
    doc.text(invoiceData.sender.country, 200, 95, { align: 'right' });
    doc.text(`Phone: ${invoiceData.sender.phone}`, 200, 110, { align: 'right' });
    doc.text(`Email: ${invoiceData.sender.email}`, 200, 125, { align: 'right' });
    doc.text(`Website: ${invoiceData.sender.website}`, 200, 140, { align: 'right' });

    // Add client information
    doc.moveDown().fontSize(12).text('Invoice to:', 50, 200);
    doc.fontSize(10).text(invoiceData.client.company, 50, 215);
    doc.text(invoiceData.client.address, 50, 230);
    doc.text(`Email: ${invoiceData.client.email}`, 50, 245);
    doc.text(`Phone: ${invoiceData.client.phoneNumber}`, 50, 260);

    // Add invoice details
    doc.moveDown().fontSize(12).text(`Invoice Number: ${invoiceData.invoiceNumber}`, 50, 300);
    doc.text(`Invoice Date: ${invoiceData.invoiceDate}`, 50, 315);

    // Add product details in a table-like structure
    const tableTop = 350;
    const itemCodeX = 50;
    const descriptionX = 100;
    const quantityX = 300;
    const sizeX = 350;
    const colorX = 400;
    const priceX = 450;

    doc.moveDown().fontSize(12).text('Products:', 50, tableTop - 20);

    doc.fontSize(10);
    doc.text('Description', descriptionX, tableTop, { underline: true });
    doc.text('Quantity', quantityX, tableTop, { underline: true });
    doc.text('Size', sizeX, tableTop, { underline: true });
    doc.text('Color', colorX, tableTop, { underline: true });
    doc.text('Price (INR)', priceX, tableTop, { underline: true });

    let position = tableTop + 20;
    invoiceData.products.forEach((product, i) => {
      const y = tableTop + 25 + (i * 20);
      doc.text(product.description, descriptionX, y);
      doc.text(product.quantity, quantityX, y);
      doc.text(product.size, sizeX, y);
      doc.text(product.color, colorX, y);
      doc.text(product.price, priceX, y);
    });

    // Add delivery charge and total amount
    const yPosition = position + (invoiceData.products.length * 20);
    doc.moveDown().fontSize(12).text(`Delivery Charge: INR ${invoiceData.deliveryCharge}`, 50, yPosition + 40);
    if (invoiceData.discount > 0) {
      doc.text(`Discount: -INR ${invoiceData.discount}`, 50, yPosition + 60);
    }
    doc.text(`Total Amount: INR ${invoiceData.totalAmount}`, 50, yPosition + 80);

    // Add bottom notice
    doc.moveDown().fontSize(10).text(invoiceData.bottomNotice, 50, yPosition + 100);

    // Finalize the PDF and end the stream
    doc.end();

    stream.on('finish', () => {
      res.download(path.join(__dirname, '..', 'public', 'invoice.pdf'), 'invoice.pdf', (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          res.status(500).send('Error downloading invoice');
        } else {
          fs.unlinkSync(path.join(__dirname, '..', 'public', 'invoice.pdf'));
        }
      });
    });
  } catch (err) {
    console.error('Error fetching orders or generating invoice:', err);
    res.status(500).send('Error fetching orders or generating invoice');
  }
};

const cancelorder = async (req, res) => {
  try {

    const orderId = req.body.orderId;

    const productIds = req.body.productIds


    const updatedOrder = await order.findOneAndUpdate(
      {
        _id: orderId,
        'products.productId': { $in: productIds }
      },
      // {$set:{'products.$[elem].productStatus': ' requested for cancelletion'}  },
      { $set: { 'products.$[elem].productStatus': "Cancelled" } },


      { new: true, arrayFilters: [{ 'elem.productId': { $in: productIds } }] }

    )


    if ((updatedOrder.paymentMethod == 'razorpay' || updatedOrder.paymentMethod == 'wallet') && (updatedOrder.paymentStatus != "failed")) {

      const userId = updatedOrder.userId
      //  const refundedAmount = productsToUpdate.productPrice * productsToUpdate.quantity;
      const refundedAmount = updatedOrder.amount
      const wallets = await wallet.findOne({ userId: userId })
      wallets.balance += refundedAmount
      wallets.transactions.push({
        transactionType: 'credit',
        amount: refundedAmount,
        transactionDate: new Date(),
        creditedDate: new Date(), // Assuming credited immediately
        description: 'Refund from cancel', // You can customize the description as needed
      });





      await wallets.save()
    }




    res.status(200).send({ message: 'Order cancelled successfully', data: updatedOrder });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).send('An error occurred while cancelling the order.');
  }
}
const returnOrder = async (req, res) => {

  try {

    const orderId = req.body.orderId;

    const productIds = req.body.productIds
    const returnReason = req.body.returnReason




    const updatedOrder = await order.findOneAndUpdate(
      {
        _id: orderId,
        'products.productId': { $in: productIds }
      },
      {
        $set: {
          'products.$[elem].requestCancellation': 'order return request',
          'products.$[elem].productStatus': 'requested for return',
          'products.$[elem].returnReason': returnReason
        }
      },
      {
        new: true,
        arrayFilters: [{ 'elem.productId': { $in: productIds } }]
      }
    );

    res.status(200).send({ message: 'Order return request sent successfully', data: updatedOrder });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).send('An error occurred while cancelling the order.');
  }
}




const ordersuccess = async (req, res) => {
  const User = req.session.user
  const orderdetails = await order.findOne().sort({ createdAt: -1 });
  orderdetails.orderedDateFormatted = formatDate(orderdetails.orderedDate);
  for (const orderproduct of orderdetails.products) {
    const products = await product.findById(orderproduct.productId)
    const sizeDetail = products.sizeDetails.find(
      (detail) => detail.size === orderproduct.size
    );
    const colorQty = sizeDetail.colorQuantities.find(
      (qty) => qty.color === orderproduct.color
    );

    colorQty.quantity -= orderproduct.quantity;


    await products.save();
  }


  const productDetails = [];
  for (const productId of orderdetails.productIds) {
    const products = await product.findById(productId);
    if (products) {
      productDetails.push(products);
    }


    orderdetails.productDetails = productDetails;

  }
  res.render('user/orderSuccess', { orderdetails, User })
}

const orderFailure = async (req, res) => {
  try {

    const User = req.session.user
    const failureData = req.body.failureData;
    const userId = req.session.userId

    let orderId;

    // const orderId=failureData[0]._id
    if (failureData && failureData.length > 0 && failureData[0]._id) {
      orderId = failureData[0]._id;
    }
    else {

      const productIdsArray = failureData.productIds.split(',').map(productId => new mongoose.Types.ObjectId(productId.trim()));

      const cartItems = await cart.find({ productId: { $in: productIdsArray }, userId: userId });

      const productsDetails = [];
      for (const item of cartItems) {

        const productDetail = {
          productId: item.productId,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          productPrice: item.price

        };
        productsDetails.push(productDetail);
      }


      const newOrder = new order({
        userId: userId,
        addressId: failureData.selectedAddressId,
        paymentMethod: failureData.paymentMethod,
        amount: failureData.amount,
        productIds: productIdsArray,
        products: productsDetails,
        orderedDate: new Date(),
        paymentStatus: 'failed',


      });
      if (failureData.couponId && mongoose.Types.ObjectId.isValid(failureData.couponId)) {
        newOrder.couponId = failureData.couponId;
      }

      await newOrder.save()
      const cartItemsToRemove = await cart.deleteMany({ productId: { $in: productIdsArray }, userId: userId });
      return res.status(200).json({ success: true, message: 'Order failure processed successfully', orderId: newOrder._id });
    }

    const existingOrder = await order.findById(orderId);

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }


    existingOrder.paymentStatus = 'failed';


    await existingOrder.save();
    console.log("Orderfailed Saved Successfully");


    res.status(200).json({ success: true, message: 'Order failure processed successfully' });
  } catch (error) {
    console.error('Error rendering orderFailure page:', error);
    res.status(500).send('Internal Server Error');
  }
}

const orderFailurePage = async (req, res) => {

  const userId = req.session.userId
  const orderId = req.params.id

  const orderdetails = await order.findOne({ _id: orderId })
  orderdetails.orderedDateFormatted = formatDate(orderdetails.orderedDate);
  for (const orderproduct of orderdetails.products) {
    const products = await product.findById(orderproduct.productId)
    const sizeDetail = products.sizeDetails.find(
      (detail) => detail.size === orderproduct.size
    );
    const colorQty = sizeDetail.colorQuantities.find(
      (qty) => qty.color === orderproduct.color
    );


    await products.save();
  }


  const productDetails = [];
  for (const productId of orderdetails.productIds) {
    const products = await product.findById(productId);
    if (products) {
      productDetails.push(products);
    }


    orderdetails.productDetails = productDetails;

  }
  const orderDetailsJSON = JSON.stringify(orderdetails);
  res.render('user/orderFailure', { orderdetails, orderDetailsJSON })
}

const placeorderFailure = async (req, res) => {
  try {

    const userId = req.session.userId
    //const { selectedAddressId, paymentmethod, productIds, amount, totalAmount,totalAmountInput ,couponIdInput} = req.body
    const { selectedAddressId, paymentmethod, productIds, totalAmountInput, couponIdInput, orderIdToRetry } = req.body

    const productIdsArray = productIds.split(',').map(productId => new mongoose.Types.ObjectId(productId.trim()));

    const cartItems = await cart.find({ productId: { $in: productIdsArray }, userId: userId });

    const productsDetails = [];
    for (const item of cartItems) {

      const productDetail = {
        productId: item.productId,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        productPrice: item.price

      };
      productsDetails.push(productDetail);
    }


    //   const newOrder = new order({
    //     userId: userId,
    //     addressId: selectedAddressId,
    //     paymentMethod: paymentmethod,
    //     amount: totalAmountInput,
    //     productIds: productIdsArray,
    //     products: productsDetails,
    //     orderedDate: new Date(),
    //     paymentStatus: 'pending',


    //   });
    //   if (couponIdInput && mongoose.Types.ObjectId.isValid(couponIdInput)) {
    //     newOrder.couponId = couponIdInput; // Assign valid ObjectId
    // }
    //   console.log("new" + newOrder)

    //       newOrder.paymentStatus = 'paid'; 



    const existingOrder = await order.findById(orderIdToRetry);

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    existingOrder.paymentStatus = 'paid';


    await existingOrder.save();


    const cartItemsToRemove = await cart.deleteMany({ productId: { $in: productIdsArray }, userId: userId });

    res.status(200).json({ success: true, message: 'Order placed successfully' });
  }
  catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Failed to place order', error: error.message });
  }

}





const wishlistPage = async (req, res) => {
  try {

    const wishlistdata = await wishlist.find({ userId: req.session.userId }).populate(
      {
        path: 'products.productId',
        model: 'product',
        select: 'name image price',
      }
    );

    const simplifiedData = wishlistdata.map(item => {
      const firstProduct = item.products.length > 0 ? item.products[0].productId : null;
      if (firstProduct) {
        return {
          productId: firstProduct._id,
          name: firstProduct.name,
          image: firstProduct.image.paths[0] || '',
          price: firstProduct.price,
        };
      }
      return null;
    }).filter(item => item !== null);

    res.render('user/wishlist', { wishlistdata: simplifiedData });
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).send('Internal Server Error');
  }
}

const addToWishlist = async (req, res) => {
  const { productId, cartData, price } = req.body



  const userId = req.session.userId
  try {
    const existingItem = await wishlist.findOne({
      userId,
      products:
        { $elemMatch: { productId: productId } }
    })
    if (existingItem) {

      return res.status(400).json({ error: 'Product already exists in wishlist' });
    }

    const newItem = new wishlist({
      userId,
      products: [{ productId, price: cartData.price, size: cartData.size, color: cartData.color, quantity: cartData.quantity }]
    })

    await newItem.save()
    res.status(201).json(newItem); // Send the newly added item as respons
   

  }
  catch (err) {
    console.error('Error adding product to wishlist:', err);
    res.status(500).json({ error: 'Error adding product to wishlist' });
  }
}

const removeFromWishlist = async (req, res) => {

  const { productId } = req.body

  const userId = req.session.userId;
  try {
    const removedItem = await wishlist.findOneAndDelete({ userId: userId, 'products.productId': productId })

    if (!removedItem) {
      return res.status(404).json({ error: 'Product not found in wishlist' })
    }

    res.status(200).json({ message: 'Product removed from wishlist successfully' });

  }
  catch (err) {
    console.error('Error removing product from wishlist:', err);
    res.status(500).json({ error: 'Error removing product from wishlist' });
  }

}

const addtoCartfromWishlist = async (req, res) => {

  const userId = req.session.userId
  const { productId } = req.body
  try {
    const wishlistItem = await wishlist.findOne({ userId: userId, "products.productId": productId }).populate("products.productId");


    if (!wishlistItem) {

      return res.status(404).json({ message: "Wishlist not found for the user." });
    }

    const productInWishlist = wishlistItem.products.find(item => item.productId._id.toString() === productId);


    if (!productInWishlist) {

      return res.status(404).json({ message: "Product not found in the wishlist." });
    }

    const productDetails = await product.findOne({ _id: productId })
    const stock = productDetails.sizeDetails.reduce((quantity, sizeDetail) => {

      if (sizeDetail.size === productInWishlist.size) {

        const colorQuantity = sizeDetail.colorQuantities.find(colorQuantities => {
          return colorQuantities.color === productInWishlist.color;
        });

        if (colorQuantity) {
          return colorQuantity.quantity;
        }
      }
      return quantity;
    }, 0);


    const newCartItem = new cart({
      userId: userId,
      productId: productId,
      quantity: productInWishlist.quantity,
      color: productInWishlist.color,
      size: productInWishlist.size,
      price: productInWishlist.price,
      totalprice: productInWishlist.price,
      stock: stock
    });


    await newCartItem.save();


    wishlistItem.products = wishlistItem.products.filter(item => item.productId._id.toString() !== productId);
    await wishlistItem.save();

    res.status(200).json({ message: "Product added to cart from wishlist successfully." });
  } catch (error) {
    console.log(error)
    console.error("Error adding product to cart:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}








function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const search = async (req, res) => {
  try {


    const searchText = req.query.search || req.body.search;
    const pageNum = req.query.pageNum || req.body.pageNum || 1;
    const categoryId = req.query.category || req.body.category

    const pageSize = 2
    let query = { name: { $regex: `^${searchText}`, $options: 'i' } };
    if (categoryId) {
      query.category = categoryId
    }
    const totaldocuments = await product.countDocuments(query);
    const totalPages = Math.ceil(totaldocuments / pageSize);
    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }


    const data = await product.find(query).skip((pageNum - 1) * pageSize)
      .limit(pageSize)
    const categoryData = await category.find()
    const noResults = data.length === 0;
    res.render("shop", { data, categoryData, searchText, pages, noResults })

  }
  catch (error) {
    console.log(error)
  }
}
const walletPage = async (req, res) => {
  const userId = req.session.userId
  const data = await wallet.findOne({ userId: userId })
  // const credited=data.map(item=>{return item.transactions.map(transactions=>transactions.creditedDate)})
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  data.transactions.forEach(transaction => {
    // Format creditedDate for each transaction
    transaction.formattedDate = new Intl.DateTimeFormat('en-US', options).format(transaction.creditedDate);
  });

  res.render('user/wallet', { data })

}
const checkCoupon = async (req, res) => {

  const { couponCode } = req.body;
  const userId = req.session.userId;


  try {

    const couponDetails = await coupon.findOne({ code: couponCode });

    if (!couponDetails) {

      res.status(400).json({ success: false, message: 'Invalid coupon code.' });
      return;
    }
    const currentDate = new Date()

    if (currentDate > couponDetails.validUntil) {
      res.status(400).json({ success: false, message: 'Coupon expired.' });
      return;
    }

    const couponId = couponDetails._id;


    const existingCouponUse = await order.findOne({
      userId: userId,
      couponId: couponId
    });

    if (existingCouponUse) {

      res.status(400).json({ success: false, message: 'Coupon already used.' });
      return;
    }

    const discountAmount = couponDetails.discountAmount;

    res.json({ success: true, discountAmount, couponId });

  } catch (error) {
    console.error('Error checking coupon:', error);
    res.status(500).json({ success: false, message: 'Error checking coupon.' });
  }
}

const couponlist = async (req, res) => {

  try {

    const coupons = await coupon.find()
    res.status(200).json(coupons)


  }
  catch (error) {

  }
}


module.exports = {
  getLanding,
  get_register,
  getOtppage,
  sentOtp,
  resendOtp,
  createUser,
  get_login,
  post_login,
  emailForm,
  forgotSentOtp,
  forgotEnterotp,
  checkOtp,
  forgotChangePasswordPage,
  forgotchangePassword,
  all,
  women,
  men,
  kids,
  accessories,
  categories,
  product_details,
  logout,
  myProfile,
  editProfilePage,
  editProfile,
  changepasswordPage,
  changepassword,
  addressPage,
  addAddressPage,
  addAddress,
  editAddressPage,
  editAddress,
  availability,
  lowToHigh,
  HighToLow,
  checkout,
  placeorder,
  myorder,
  orderDetails,
  cancelorder,
  returnOrder,
  deleteAddress,
  ordersuccess,
  createRazorpayOrder,
  isOrderCompleted,
  addToWishlist,
  wishlistPage,
  removeFromWishlist,
  addtoCartfromWishlist,
  search,
  walletPage,
  checkCoupon,
  orderFailure,
  orderFailurePage,
  placeorderFailure,
  downloadInvoice,
  couponlist




}
