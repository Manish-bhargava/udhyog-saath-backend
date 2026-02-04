const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Directory to store uploaded files temporarily
  },
  filename: (req, file, cb) => {
    // cb(null, file.originalname); // Use the original filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|pdf/; // Allowed file types (regex raw string)
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(
    file.originalname.split(".").pop().toLowerCase(),
  );

  if (mimetype && extname) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Only images and PDFs are allowed!")); // Reject the file
  }
};

const uploads = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

module.exports = {
  uploads,
};
