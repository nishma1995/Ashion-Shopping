const isAdminAuthenticated = (req, res, next) => {
   
    if (req.session.isAdminAuthenticated) {
      res.redirect("/admin/productManagement");
    } else {
      next();
    }
  };
  
  module.exports = isAdminAuthenticated;