const UserAuthenticated = (req, res, next) => {
   
  
    if (req.session.isUserAuthenticated) {
     
      res.redirect("/");
      } else {
        next();
        
      }
  };
 
  
  module.exports = UserAuthenticated;