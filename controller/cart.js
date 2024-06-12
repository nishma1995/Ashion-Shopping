const cart = require("../model/cart")
const product = require("../model/product")

const addtocart = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {

            return res.status(401).json({ message: 'Please log in.' });
        }

        const id = req.session.userId


        const cartData = req.body;


        //const Price = +cartData.price;

        const productdetails = await product.findOne({ _id: cartData.productId })


        const existingCartItems = await cart.find({ userId: id, productId: cartData.productId });

        const totalQuantityInCart = existingCartItems.reduce((total, item) => total + item.quantity, 0);

        const maxAllowedQuantity = productdetails.maxQuantityPerPerson;

        const quantityToAdd = +cartData.quantity;
        if (totalQuantityInCart + quantityToAdd > maxAllowedQuantity) {
            return res.status(200).json({ message: `Exceeds maximum allowed quantity (${maxAllowedQuantity}) per person for this product` });
        }
        const allreadyHaveProduct = await cart.findOne({ productId: cartData.productId })
        if (allreadyHaveProduct) {
            return res.status(200).json({ message: "product is allready there in cart" })
        }

        if (productdetails.status) {

            const newItem = new cart({

                userId: id,
                productId: cartData.productId,
                quantity: cartData.quantity,
               // price: Price,
                size: cartData.size,
                color: cartData.color,
                stock: cartData.stockleft


            }
            );


            await newItem.save();
            // console.log("item saved")


            res.status(200).json({ message: 'Item added to cart successfully!' });
        }
        else {
            res.status(200).json({ message: 'Item is out of stock! You are not able to add this item to cart' });
        }
    } catch (error) {

        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'An error occurred while adding item to cart.' });
    }


}

const cartPage = async (req, res) => {
    const id = req.session.userId

    let User = req.session.user;
    const details = await cart.find({ userId: id }).populate('productId');
    
    details.forEach(item => {
        const productPrice=item.productId.price
        const offerRate=item.productId.offerRate||0
        const discount=(productPrice*(offerRate/100))
        const finalPrice=productPrice-discount
        item.finalPrice=finalPrice
        item.totalprice = (item.quantity * finalPrice).toFixed(2)
    })


    const sizeDetailsArray = details.map(item => item.productId.sizeDetails);





    res.render("user/cart", { details, User })
}
const remove = async (req, res) => {
    try {


        const { productId } = req.body


        // console.log(productId + "eeee")


        await cart.deleteOne({
            productId: productId
        })

        res.status(200).json({ message: 'Item deleted successfully!' });
    }


    catch (error) {
        console.error('Error removing product from cart:', error);

        res.status(500).json({ success: false, error: 'Internal server error' });
    }

}

const updatecart = async (req, res) => {
    try {


        const cartItems = req.body.cartItems;


        for (const update of cartItems) {
            const productId = update.productId;
            const newQuantity = update.quantity;
            const total = update.total
            const cartData = await cart.findOne({ productId: productId });


            if (cartData) {
                if (newQuantity > 6) {

                    return res.status(400).json({ message: `Quantity exceeds maximum limit for product ${productId}` });
                }



                cartData.quantity = newQuantity;
                cartData.totalprice = total

                await cartData.save();

            }
        }

        res.status(200).json({ message: 'Cart updated successfully' });

    } catch (error) {
        console.error('Error updating cart:', error.message);
        console.log("error.message");
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    addtocart,
    cartPage,
    remove,
    updatecart
}