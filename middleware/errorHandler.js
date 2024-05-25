const errorHandler = (error, req, res, next) => {
    const errorStatusCode = error.statusCode || 500;
    const errormessage = error.message || "Unexpted error";
    const errormessag = `${errormessage}(${errorStatusCode})`;
    if (errorStatusCode === 404) {
      res.render("error", { message: errormessag });
    } else {
      console.log(errormessage);
      res.render("error", { message: "Internal server error" });
    }
  };
  module.exports = errorHandler;