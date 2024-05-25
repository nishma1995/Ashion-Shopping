const isUserAuthenticated = (req, res, next) => {
    console.log("reached userauthentication");
  
    if (req.session.isUserAuthenticated) {
      next();
      } else {
   
        res.redirect("/login");
      }
  };
 
  
  module.exports = isUserAuthenticated;