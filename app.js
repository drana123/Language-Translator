const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
const tesseract = require('node-tesseract');
 
// Set The Storage Engine
var ctr=1;
 
const app = express();

// EJS
app.set('view engine', 'ejs');

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-'+ ctr+ path.extname(file.originalname));
    ctr=ctr+1;
  }
});

// Init Upload


const upload = multer({
  storage: storage,
  limits:{fileSize: 100000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');

// Check File Type
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}

// Init app


// Public Folder
app.use(express.static('./public'));

app.get('/', (req, res) => res.render('new'));

const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient({
	keyFileName:'./APIkey.json'
});

app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if(err){
      res.render('new');
    } else {
      if(req.file == undefined){
        res.render('new');
      } else {
      	 const fileName =`uploads/${req.file.filename}`;
      	 const [result] = await client.textDetection(fileName);
         const detections = result.textAnnotations;
         const {Translate} = require('@google-cloud/translate').v2;
         const translate = new Translate();
         const text = detections;
         const target = req.target;
         async function translateText() {
  
      let [translations] = await translate.translate(text, target);
        translations = Array.isArray(translations) ? translations : [translations];
        }

translateText();         
          detections.forEach(text => console.log(text));
      res.render('output', {file: `uploads/${req.file.filename}`,text:translations,extract:detections});
        
      }
    }
  });
});

const port = 3000;

app.listen(port, () => console.log(`Server started on port ${port}`));