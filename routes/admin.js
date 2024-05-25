const express=require('express')
const router=express.Router()
const admin=require('../controller/admin')
const upload=require('../middleware/multer')
const isadminAuthenticated=require('../middleware/adminAuthentication')
const adminAuthenticated=require('../middleware/isAdminAuthenticated')

router.get('/',adminAuthenticated,admin.get_login)
router.post('/',admin.post_login)

router.get('/dashboard',admin.dashboard)
router.get('/sales-data', admin.SalesData);


router.get('/userManagement',isadminAuthenticated,admin.get_UserManagement)
router.put('/blockUnblock/:id',isadminAuthenticated,admin.blockUnblock)
//router.put('/unblock/:id',admin.unblock)
router.delete('/delete/:id',isadminAuthenticated,admin.getDelete)

router.get('/productManagement',isadminAuthenticated,admin.productManagement)
router.get('/addProduct',isadminAuthenticated,admin.addProductPage)
router.post('/addProduct',isadminAuthenticated,upload.array('image[]'),admin.addProduct)
router.get('/editProduct/:id',isadminAuthenticated,admin.editProductPage)
router.put('/editProduct/:id',isadminAuthenticated,upload.array('image[]'),admin.editProduct)
router.delete('/deleteProduct/:id',isadminAuthenticated,admin.deleteProduct)

router.get('/categoryManagement',isadminAuthenticated,admin.categoryManagement)
router.get('/addCategory',isadminAuthenticated,admin.addCategoryPage)
router.post('/addCategory', isadminAuthenticated,upload.single('categoryImage'),admin.addCategory)
router.get('/editCategory/:id',isadminAuthenticated,admin.editCategoryPage)
router.put('/editCategory/:id',isadminAuthenticated,upload.single('categoryImage'),admin.editCategory)
router.delete('/deleteCategory/:id',isadminAuthenticated,admin.deleteCategory)


router.get('/searchProducts',isadminAuthenticated,admin.searchProducts)
router.post('/filterByCategory',isadminAuthenticated,admin.filterProductsByCategory)

router.get('/orderManagement',isadminAuthenticated,admin.orderManagementPage)
router.get('/orderDetails/:id',isadminAuthenticated,admin.orderDetails)
router.get('/getReturnReason/:id',isadminAuthenticated,admin.returnReason)

router.put('/changeOrderStatus/:orderId',isadminAuthenticated,admin.changeOrderStatus)
router.put('/cancelOrder/:orderId',isadminAuthenticated,admin.cancelOrder)


router.get('/coupon',isadminAuthenticated,admin.couponManagement)
router.post('/addCoupon',isadminAuthenticated,admin.addCoupon)
router.put('/updateCoupon/:couponId',isadminAuthenticated,admin.updateCoupon)
router.delete('/deleteCoupon/:couponId',isadminAuthenticated,admin.deleteCoupon)


router.get('/salesReportPage',isadminAuthenticated,admin.salesReportPage)
router.get('/salesReport',isadminAuthenticated,admin.salesReport)

router.get('/offers',isadminAuthenticated,admin.offers)
router.get('/offerProducts',isadminAuthenticated,admin.offerProducts)
router.post('/saveOffer',isadminAuthenticated,admin.saveOffer)
router.delete('/deleteOffer/:offerId',isadminAuthenticated,admin.deleteOffer)
router.put('/listUnlist/',isadminAuthenticated,admin.listUnlist)



router.get('/logout',admin.logout)
module.exports=router