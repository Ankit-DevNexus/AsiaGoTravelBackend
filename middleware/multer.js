// export default upload;
import multer from "multer";
import fs from "fs";
import path from "path";

// Create uploads/ folder if not exists
const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Uploads folder created");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// IMPORTANT: do NOT add fileFilter for now
const upload = multer({ storage });

export default upload;

// import multer from "multer";

// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, './public/temp');
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + '-' +file.originalname);
//     }
// });

// const svgfileFilter = (req, file, cb) => {
//     if(file.mimetype === 'image/svg+xml') {
//         cb(null, true);
//     } else {
//         cb(new Error('Only Svg files are allower'), false);
//     }
// };

// const svgStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, './public/temp');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + '-' + file.originalname);
//     },
// });

// export const upload = multer({storage: storage});
// export const svgUpload = multer({storage: svgStorage, fileFilter: svgfileFilter});
