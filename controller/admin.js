const dotenv = require("dotenv");
dotenv.config({ path: "./configuration" });
const upload = require('../middleware/multer')
const cloudinary = require('../middleware/cloudinary')
const fs = require('fs')

const user = require("../model/user");
const product = require("../model/product");
const Category = require("../model/category");
const order = require("../model/order");
const wallet = require("../model/wallet");
const address = require("../model/address");
const coupon = require("../model/coupon")
const offer = require("../model/offer")
const { userInfo } = require("os");
const JSONTransport = require("nodemailer/lib/json-transport");



const get_login = (req, res) => {
  res.render("admin/adminLogin");
}

const post_login = async (req, res) => {
  const { email, password } = req.body;
  const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

  if (email === ADMIN_USERNAME) {
    if (password === ADMIN_PASSWORD) {
      req.session.isAdminAuthenticated = true
      const userData = await user.find()
      res.render("admin/userManagement", { userData });
    } else {
      res.render("admin/adminLogIn", { error: "Invalid Password" });
    }
  } else {
    res.render("admin/adminLogIn", { error: "Invalid Email Account" });
  }
}

const dashboard = async (req, res) => {

  const resultProduct = await product.aggregate([
    { $count: 'totalProducts' }
  ])
  const resultOrder = await order.aggregate([
    { $count: 'totalOrders' }
  ])

  const resultUser = await user.aggregate([
    { $count: 'totalUsers' }
  ])


  const count = resultProduct[0].totalProducts
  const orderCount = resultOrder[0].totalOrders
  const userCount = resultUser[0].totalUsers

  const categoryData = await order.aggregate([
    {
      $unwind: '$productIds'
    },
    {
      $lookup: {
        from: 'products',
        localField: 'productIds',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $unwind: '$product'
    },
    {
      $group: {
        _id: '$product.category',
        totalOrders: { $sum: 1 }
      }
    },
    {
      $sort: { totalOrders: -1 }
    }
  ]);

  const productSalesData = await order.aggregate([
    {
      $unwind: '$productIds',
    },
    {
      $group: {
        _id: '$productIds',
        totalQuantity: { $sum: 1 }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    {
      $project: {
        _id: 1,
        totalQuantity: 1,
        productName: { $arrayElemAt: ['$productDetails.name', 0] }
      }
    }

  ])

  const categoryIds = categoryData.map(item => item._id);


  const categories = await Category.find({ _id: { $in: categoryIds } }).select('name');
  const categorySalesData = categoryData.map(item => {
    const category = categories.find(cat => cat._id.equals(item._id));
    return {
      categoryName: category ? category.name : 'Unknown',
      totalOrders: item.totalOrders
    };
  });
  const categorySalesDataJson = JSON.stringify(categorySalesData);


  res.render('admin/dashboard', { count, orderCount, userCount, categoryData, categorySalesDataJson, productSalesData, categorySalesData })
}


const SalesData = async (req, res) => {

  const { interval } = req.query;

  let dataToSend = null;

  try {
    const monthlySalesData = await order.aggregate([
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalQuantity: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          totalQuantity: 1
        }
      }
    ]);


    const yearlySalesData = await order.aggregate([
      {
        $group: {
          _id: { $year: '$createdAt' },
          totalQuantity: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id',
          totalQuantity: 1
        }
      }
    ]);


    const expectedSales = [
      { month: 5, expectedSales: 30 },
      { month: 4, expectedSales: 20 },


    ];

    if (interval === 'monthly') {
      const monthlyChartData = monthlySalesData.map(item => ({
        label: `Month ${item.month}`,
        actualSales: item.totalQuantity,
        expectedSales: expectedSales.find(e => e.month === item.month).expectedSales
      }));
      dataToSend = monthlyChartData;
    }
    else if (interval === 'yearly') {
      const yearlyChartData = yearlySalesData.map(item => ({
        label: `Year ${item.year}`,
        actualSales: item.totalQuantity,
        expectedSales: expectedSales.reduce((acc, curr) => acc + curr.expectedSales, 0)
      }));
      dataToSend = yearlyChartData;
    }
    else {
      throw new Error('Invalid interval');
    }

    res.json(dataToSend);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




const get_UserManagement = async (req, res) => {
  const userData = await user.find({ deleted: false })
  res.render("admin/userManagement", { userData });
}

const getDelete = async (req, res) => {
  try {

    const userId = req.params.id;

    const users = await user.findByIdAndUpdate(userId, { deleted: true });

    if (!users) {
      return res.status(404).json({ error: 'user not found' });
    }

    res.status(200).json({ message: 'user deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
    console.log("i am in delete ")

  }
}

const blockUnblock = async (req, res) => {

  const users = await user.findById(req.params.id)
  users.status = !users.status
  await user.findOneAndUpdate({ _id: req.params.id }, { $set: users })
  res.redirect("/admin/UserManagement")
}

const productManagement = async (req, res) => {

  try {
    const pagenumber = parseInt(req.query.page)

    const limit = 5;
    const skip = (pagenumber - 1) * limit;

    const totalCount = await product.countDocuments({ deleted: false });


    const totalPages = Math.ceil(totalCount / limit);
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }

    const productData = await product.find({ deleted: false }).populate('category').skip(skip).limit(limit);

    res.render("admin/productManagement", { productData, totalPages, pagenumber, pages });

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal Server Error' });
  }

}

const addProductPage = async (req, res) => {
  const categories = await Category.find({});
  res.render("admin/addProduct", { categories });
}

const addProduct = async (req, res) => {
  const categories = await Category.find({});


  const uploader = async (path) => {
    try {
      const result = await cloudinary.uploads(path, 'Images');
      return result;
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      throw uploadError;
    }
  };
  let urls = []
  const files = req.files
  for (const file of files) {
    const { path } = file
    const newPath = await uploader(path)

    urls.push(newPath)
    fs.unlinkSync(path)


  }
  try {
    const imagePaths = urls.map(item => item.url);
    const finalImage = imagePaths.slice(0, 5)
    const Newproduct = {
      name: req.body.name,
      category: req.body.category,
      sizeDetails: [
        {
          size: 'S',
          colorQuantities: Object.keys(req.body.colorS).map(color => ({
            color,
            quantity: req.body.quantityS[color],
          })),
        },
        {
          size: 'M',
          colorQuantities: Object.keys(req.body.colorM).map(color => ({
            color,
            quantity: req.body.quantityM[color],
          })),
        },
        {
          size: 'L',
          colorQuantities: Object.keys(req.body.colorL).map(color => ({
            color,
            quantity: req.body.quantityL[color],
          })),
        },
      ],
      price: req.body.cost,
      description: req.body.description,
      status: req.body.status,
      image: {
        paths: finalImage
      }
    };

    if (Newproduct.price <= 0) {
      res.render("admin/addProduct", { error: "Cost should greater than zero", categories })
    }
    else {
      await product.create(Newproduct).then((result) => {

        res.redirect("/admin/productManagement");
      }).catch((error) => {

      })

    }

  } catch (error) {

  }
}
const editProductPage = async (req, res) => {
  const ProductData = await product.findById(req.params.id).populate('category');;

  const categoryData = await Category.find()
  res.render("admin/editProduct", { ProductData, categoryData });
}

const editProduct = async (req, res) => {

  const uploader = async (path) => {
    try {
      const result = await cloudinary.uploads(path, 'Images');
      return result;
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      throw uploadError;
    }
  };


  let imageUrls = [];
  const filesUploaded = req.files && req.files.length > 0


  if (filesUploaded) {
    for (const file of req.files) {
      const { path } = file;
      const newPath = await uploader(path);
      imageUrls.push(newPath.url);
      fs.unlinkSync(path);
    }

  }
  else {
    const existingProductImage = await product.findById(req.params.id)
    imageUrls = Array.isArray(existingProductImage.image.paths)
      ? existingProductImage.image.paths
      : [existingProductImage.image.paths];
  }

  try {
    const productId = req.params.id;

    const cat = await Category.findOne({ name: req.body.category })

    const updatedProduct = {
      name: req.body.name,
      category: cat._id,
      sizeDetails: [
        {
          size: 'S',
          colorQuantities: req.body.colorS.map(color => ({
            color,
            quantity: parseInt(req.body.quantityS[color]),
          })),
        },
        {
          size: 'M',
          colorQuantities: req.body.colorM.map(color => ({
            color,
            quantity: parseInt(req.body.quantityM[color]),
          })),
        },
        {
          size: 'L',
          colorQuantities: req.body.colorL.map(color => ({
            color,
            quantity: parseInt(req.body.quantityL[color]),
          })),
        },
      ],
      price: req.body.cost,
      description: req.body.description,
      status: req.body.status,
      image: {
        paths: imageUrls.slice(0, 3),

      },
    };
    await product.findByIdAndUpdate(productId, updatedProduct);

    res.redirect("/admin/productManagement");
  } catch (error) {
    console.error("Error updating product:", error);

    res.status(500).send("Internal Server Error");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const products = await product.findByIdAndUpdate(productId, { deleted: true });

    if (!products) {

      return res.status(404).json({ error: 'product not found' });
    }

    res.status(200).json({ message: 'product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}


const categoryManagement = async (req, res) => {
  const categoryData = await Category.find({ deleted: false });
  res.render("admin/categoryManagement", { categoryData });
}

const addCategoryPage = (req, res) => {
  res.render("admin/addCategory");
}

const addCategory = async (req, res) => {
  try {
    const { categoryName, categoryDescription } = req.body;
    let categoryImage;
    if (req.file) {
      categoryImage = await cloudinary.uploads(req.file.path, 'CategoryImages');
      fs.unlinkSync(req.file.path);
    }
    const lowerCaseCategoryName = categoryName.toLowerCase();
    const existingCategoryName = await Category.findOne({ name: { $regex: new RegExp('^' + lowerCaseCategoryName + '$', 'i') } })
    if (existingCategoryName) {
      return res.render("admin/addCategory", { error: "Category already exists" })
    }
    else {
      const categoryData = new Category({
        name: categoryName,
        description: categoryDescription,
        image: categoryImage ? { path: categoryImage.url } : undefined,
      });


      await Category.create(categoryData).then((result) => {
      }).catch((error) => {
        console.log(error)
      })

      res.redirect('/admin/categoryManagement');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }

}
const editCategoryPage = async (req, res) => {
  try {

    const categoryId = req.params.id;
    const categoryData = await Category.findById(categoryId);
    res.render('admin/editCategory', { categoryData });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};




const editCategory = async (req, res) => {

  try {
    let categoryImage;
    if (req.file) {
      categoryImage = await cloudinary.uploads(req.file.path, 'CategoryImages');
      fs.unlinkSync(req.file.path);
    }


    const { categoryName, categoryDescription } = req.body;
    await Category.findByIdAndUpdate(req.params.id, {
      name: categoryName,
      description: categoryDescription,
      image: categoryImage ? { path: categoryImage.url } : undefined,
    });
    res.redirect("/admin/categoryManagement");
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }

}


const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findByIdAndUpdate(categoryId, { deleted: true });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}
const searchProducts = async (req, res) => {
  try {
    const searchText = req.query.searchText;
    const filteredProducts = await product.find({ name: { $regex: `^${searchText}`, $options: 'i' } });
    res.json(filteredProducts);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
const filterProductsByCategory = async (req, res) => {
  const categoryCollection = await Category.findOne({ category: { $exists: true } })
  if (req.body.category == "Men") {
    const productData = await product.find({ category: "65e887241669554312ddf42c" }).populate('category', 'name')
    res.render("admin/productManagement", { productData, categoryCollection });
  } else if (req.body.category == "Women") {
    const productData = await product.find({ category: "65e886bf1669554312ddf426" }).populate('category', 'name')
    res.render("admin/productManagement", { productData, categoryCollection });
  } else if (req.body.category == "Kids") {
    const productData = await product.find({ category: "65e887771669554312ddf42f" }).populate('category', 'name')
    res.render("admin/productManagement", { productData, categoryCollection });
  }
  else if (req.body.category == "Accessories") {
    const productData = await product.find({ category: "65e887ad1669554312ddf432" }).populate('category', 'name')
    res.render("admin/productManagement", { productData, categoryCollection });
  }
  else {
    const productData = await product.find().populate('category', 'name')
    res.render("admin/productManagement", { productData, categoryCollection });
  }
}

const logout = (req, res) => {
  delete req.session.isAdminAuthenticated
  res.redirect("/admin");

}

const orderManagementPage = async (req, res) => {

  try {

    const orders = await order.find().sort({ _id: -1 });

    const formattedOrders = [];
    for (const order of orders) {

      const users = await user.findById(order.userId);
      const addresses = await address.findById(order.addressId);
      order.orderedformatedDate = formatDate(order.orderedDate)
      const cancellations = order.products.map(product => ({
        productId: product.productId,
        requestCancellation: product.requestCancellation

      }))

      const productIds = order.products.map(product => product.productId);

      //  product details based on product IDs and sort them based on productIds order
      const products = await product.find({ _id: { $in: productIds } });
      const sortedProducts = productIds.map(id => products.find(p => p._id.toString() === id.toString()));


      formattedOrders.push({
        orderId: order._id,
        user: users ? `${users.firstname} ${users.lastname}` : 'Unknown User',
        products: sortedProducts.map(prod => ({ productId: prod._id, name: prod.name })),
        address: addresses ? addresses.address : 'Unknown Address',
        paymentMethod: order.paymentMethod,
        orderedDate: order.orderedformatedDate,
        cancellationRequests: cancellations,
        statusData: order.products.map(details => ({ status: details.productStatus, productId: details.productId })),
        amount: order.amount
      });
    }


    res.render('admin/orderManagement', { orders: formattedOrders });
  } catch (error) {
    console.error('Error retrieving order data:', error);
    res.status(500).send('An error occurred while fetching order data.');
  }
};
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const orderDetails = async (req, res) => {
  const id = req.params.id
  const orderDetails = await order.findById(id).populate('products.productId')
  const orderDetailsArray = [orderDetails];
  const orderDetailsJSON = JSON.stringify(orderDetailsArray);
  res.render('admin/orderDetails', { orderDetails, orderDetailsJSON })

}



const changeOrderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.body.status;
  const productId = req.body.productId
  try {
    const orders = await order.findById(orderId)
    if (!orders) {
      return res.status(404).json({ message: 'order not found' })
    }
    let productsToUpdate = null;
    orders.products.map(product => {
      if (product.productId.toString() === productId.toString()) {
        product.productStatus = newStatus
        productsToUpdate = product;
      }
    }
    )

    const updatedOrder = await orders.save()


    if ((orders.paymentMethod == 'razorpay' || orders.paymentMethod == 'wallet') && (newStatus == 'Returned' || newStatus == 'Cancelled')) {

      const userId = orders.userId
      const refundedAmount = orders.amount
      const wallets = await wallet.findOne({ userId: userId })
      wallets.balance += refundedAmount
      wallets.transactions.push({
        transactionType: 'credit',
        amount: refundedAmount,
        transactionDate: new Date(),
        creditedDate: new Date(),
        description: 'Refund from order',
      });





      await wallets.save()


      // Update product quantity
      const productToUpdate = await product.findById(productsToUpdate.productId);
      if (productToUpdate) {
        productToUpdate.sizeDetails.forEach(sizeDetail => {
          sizeDetail.colorQuantities.forEach(colorQuantity => {
            if (
              sizeDetail.size === productsToUpdate.size &&
              colorQuantity.color === productsToUpdate.color
            ) {
              colorQuantity.quantity += productsToUpdate.quantity;
            }
          });
        });
        await productToUpdate.save();
      }



    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error changing order status:', error);
    res.status(500).json({ message: 'An error occurred while changing order status' });
  }
}

const returnReason = async (req, res) => {
  const id = req.params.id
  const orderReturnDetails = await order.findById(id)
  const returnReason = orderReturnDetails.products.map(product => product.returnReason)
  res.json(returnReason)
}

const cancelOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const productId = req.body.productId
  try {
    const orders = await order.findById(orderId)
    if (!orders) {
      return res.status(404).json({ message: 'order not found' })
    }
    orders.products.map(product => {
      if (product.productId.toString() === productId.toString()) {
        product.productStatus = "cancelled"
      }
    }
    )
    const updatedOrder = await orders.save()
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error changing order status:', error);
    res.status(500).json({ message: 'An error occurred while changing order status' });

  }
}


const formatDateForInput = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};



const couponManagement = async (req, res) => {
  const couponDatas = await coupon.find()
  const couponData = couponDatas.map(coupon => ({
    ...coupon._doc,
    validUntilFormatted: formatDateForInput(coupon.validUntil)
  }));

  res.render('admin/couponManagement', { couponData })
}

const addCoupon = async (req, res) => {
  const { code, discountAmount, validUntil, maxUses } = req.body;
  try {
    const existingCoupon = await coupon.findOne({ code: code })
    if (existingCoupon) {

      return res.status(400).json({ error: 'Coupon code already exists.' });
    }
    const currentDate = new Date();
    const couponValidUntil = new Date(validUntil);

    if (couponValidUntil <= currentDate) {

      return res.status(400).json({ error: 'Coupon valid until date must be in the future.' });
    }
    const newCoupon = new coupon(
      {
        code: code,
        discountAmount: discountAmount,
        validUntil: validUntil,
        usedCount: 1,

        maxUses: maxUses
      }
    )


    await newCoupon.save()
    res.status(200).json({ message: 'Coupon saved successfully.', coupon: newCoupon });
  } catch (err) {

    console.error('Error saving coupon:', err);
    res.status(500).json({ error: 'Error saving coupon.' });
  }
}

const updateCoupon = async (req, res) => {
  const couponId = req.params.couponId;
  const { code, discountAmount, validUntil, maxUses } = req.body;


  try {

    const coupons = await coupon.findById(couponId);
    const allCoupons = await coupon.find()
    for (let i = 0; i < allCoupons.length; i++) {
      const currentCouponIdString = allCoupons[i]._id.toString();
      const requestedCouponIdString = couponId.toString();

      if (currentCouponIdString === requestedCouponIdString) {

        continue;
      }

      if (code === allCoupons[i].code) {
        return res.status(400).json({ error: 'Coupon allready exists' });
      }
    }

    if (!coupons) {
      return res.status(404).json({ error: 'Coupon not found' });
    }


    coupons.code = code;
    coupons.discountAmount = discountAmount;
    coupons.validUntil = validUntil;
    coupons.maxUses = maxUses;


    await coupons.save();

    res.status(200).json({ message: 'Coupon updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }

}

const deleteCoupon = async (req, res) => {
  const couponId = req.params.couponId;
  try {

    await coupon.findByIdAndDelete(couponId);

    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
}

const salesReportPage = async (req, res) => {
  try {

    let query = { 'products.productStatus': 'Delivered' };
    const orders = await order.find(query)
      .sort({ _id: -1 })
      .populate({
        path: 'productIds',
        select: 'name',
      })
      .populate({
        path: 'userId',
        select: 'firstname',
      })
      .exec();

    orders.forEach(order => {
      order.formattedDate = order.orderedDate.toLocaleDateString('en-US');
    });

    res.render('admin/salesReport', { orders });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}


const salesReport = async (req, res) => {
  try {
    let query = { 'products.productStatus': 'Delivered' };

    const period = req.query.period

    if (period === 'day') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0); // Set time to the beginning of today
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999); // Set time to the end of today
      query.orderedDate = { $gte: todayStart, $lte: todayEnd };
    } else if (period === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of current week (Sunday)
      const endOfWeek = new Date();
      endOfWeek.setHours(23, 59, 59, 999);
      endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay())); // End of current week (Saturday)
      query.orderedDate = { $gte: startOfWeek, $lte: endOfWeek };
    } else if (period === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setHours(0, 0, 0, 0);
      startOfMonth.setDate(1); // Start of current month
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Move to next month
      endOfMonth.setDate(0); // Set to last day of current month
      endOfMonth.setHours(23, 59, 59, 999);
      query.orderedDate = { $gte: startOfMonth, $lte: endOfMonth };
    }
    else if (period === 'custom') {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      query.orderedDate = { $gte: startDate, $lte: endDate };
    }

    const orders = await order.find(query)
      .sort({ _id: -1 })
      .populate({
        path: 'productIds',
        select: 'name'
      })
      .populate({
        path: 'userId',
        select: 'firstname'
      })
      .exec();

    const formattedOrders = [];

    const formatDate = (date) => {
      return date.toLocaleDateString('en-US');
    };

    orders.forEach(order => {
      const formattedOrder = { ...order.toObject(), formattedDate: formatDate(order.orderedDate) };
      formattedOrders.push(formattedOrder);
    });

    res.json(formattedOrders);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }


}

const offers = async (req, res) => {


  const categorydata = await Category.find()
  const offers = await offer.find().populate({
    path: 'products',
    model: 'product',
  })
    .exec();

  res.render('admin/offers', { categorydata, offers })
}
const offerProducts = async (req, res) => {
  const category = req.query.category
  const categoryData = await Category.findOne({ name: category },)
  const products = await product.find({ category: categoryData._id, $or: [{ offerRate: false }, { offerRate: { $exists: false } }] })
  res.json(products)
}

const saveOffer = async (req, res) => {

  try {
    const { category, title, rate, selectedProducts } = req.body
    const titleCheck = await offer.findOne({ title: title })
    if (titleCheck) {
      return res.status(400).send('Offer with the same title already exists.');
    }


    const newOffer = new offer(
      {
        category: category,
        title: title,
        rate: rate,
        products: selectedProducts
      }
    )
    await newOffer.save()
    for (let i = 0; i < req.body.selectedProducts.length; i++) {
      await product.findByIdAndUpdate(req.body.selectedProducts[i],
        { $set: { offerRate: rate } }
      )

    }

    res.status(201).send('Offer saved successfully');

  }
  catch (error) {
    res.status(500).send('Error saving offer');
  }

}

const deleteOffer = async (req, res) => {
  const offerId = req.params.offerId;
  try {
    const productsData = await offer.find({ _id: offerId })
    const getId = productsData[0].products
    for (let i = 0; i < getId.length; i++) {
      const a = await product.findOneAndUpdate({ _id: getId[i] }, { $unset: { offerRate: " " } })

    }


    await offer.findByIdAndDelete(offerId);


    res.status(200).json({ message: 'offer deleted successfully' });
  } catch (error) {
    console.log(error)
  }

}
const listUnlist = async (req, res) => {
  try {
    const productId = req.body.productId;


    const offers = await offer.findById(productId);
    if (offers.status) {
      for (let i = 0; i < offers.products.length; i++) {
        await product.findByIdAndUpdate(offers.products[i], { $set: { offerRate: 0 } })

      }
      offers.status = !(offers.status)

    }
    else {
      for (let i = 0; i < offers.products.length; i++) {
        await product.findByIdAndUpdate(offers.products[i], { $set: { offerRate: offers.rate } })

      }
      offers.status = !(offers.status)

    }
    await offers.save()


    res.json(offers.status)
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating offer status");
  }
}


module.exports = {
  get_login,
  post_login,
  get_UserManagement,
  getDelete,
  blockUnblock,
  productManagement,
  addProduct,
  addProductPage,
  editProductPage,
  editProduct,
  deleteProduct,
  categoryManagement,
  addCategory,
  addCategoryPage,
  editCategoryPage,
  editCategory,
  deleteCategory,
  searchProducts,
  filterProductsByCategory,
  logout,
  orderManagementPage,
  changeOrderStatus,
  cancelOrder,
  couponManagement,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  salesReportPage,
  salesReport,
  offers,
  offerProducts,
  saveOffer,
  deleteOffer,
  listUnlist,
  dashboard,
  SalesData,
  orderDetails,
  returnReason



};

