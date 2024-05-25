const UserAuthenticated = (req, res, next) => {
    console.log("reached userauthentication");
  
    if (req.session.isUserAuthenticated) {
     
      res.redirect("/");
      } else {
        next();
        
      }
  };
 
  
  module.exports = UserAuthenticated;