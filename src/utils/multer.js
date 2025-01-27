const multer = require("multer");

const multerStorage = multer.memoryStorage();

const multerMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

const upload = multer({
  storage: multerStorage,
});

const uploadManyToMulter = upload.array("files");

module.exports = { multerMiddleware, uploadManyToMulter };
