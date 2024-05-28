const isUserAuthenticated = (req, res, next) => {
  
  
    if (req.session.isUserAuthenticated) {
      next();
      } else {
   
        res.redirect("/login");
      }
  };
 
  
  module.exports = isUserAuthenticated;