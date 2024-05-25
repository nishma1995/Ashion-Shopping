const isAdminAuthenticated = (req, res, next) => {
    console.log("reached middle");
    if (req.session.isAdminAuthenticated) {
      res.redirect("/admin/productManagement");
    } else {
      next();
    }
  };
  
  module.exports = isAdminAuthenticated;