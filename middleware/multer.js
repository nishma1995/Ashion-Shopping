const multer=require('multer')

// const storage = multer.memoryStorage()
const storage = multer.diskStorage({
  destination: function (req, files, cb) {
    cb(null,'uploads'); // Destination folder for file uploads
  },
  filename: function (req, files, cb) {
    cb(null, Date.now() + '-' + files.originalname); // Use current timestamp as filename
  }
});
const upload = multer({ storage });

module.exports=upload