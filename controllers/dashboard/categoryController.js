const categoryModel = require("../../models/categoryModel");
const { responseReturn } = require("../../utils/response"); 
const cloudinary = require("cloudinary");
const formidable = require("formidable");

class categoryController {
    add_category = async (req, res) => {
      
    const form = new formidable.IncomingForm();
      form.parse(req, async (err, fields, files) => {
      
      if (err) {
        responseReturn(res, 404, { error: "something error" });
      } else {
        let { name } = fields;
        let { image } = files; 
        
        name = name[0].trim();
        const slug = name.split(" ").join("-");
  

        cloudinary.config({
          cloud_name: process.env.cloud_name,
          api_key: process.env.api_key,
          api_secret: process.env.api_secret,
          secure: true,
        });

        try {
          const result = await cloudinary.v2.uploader.upload(image[0].filepath, {
            folder: "categorys",
          });
          
          if (result) {
            const category = await categoryModel.create({
              name,
              slug,
              image: result.url,
            });
            responseReturn(res, 201, {
              category,
              message: "category add success",
            });
          } else {
            responseReturn(res, 404, { error: "Image upload failed" });
          }
        } catch (error) {
          responseReturn(res, 500, { error: "Internal server error" });
        }
      }
    });
    };
    

  get_category = async (req, res) => {
    
    const { page, searchValue, parPage } = req.query;
    try {
      let skipPage = "";
      if (parPage && page) {
        skipPage = parseInt(parPage) * (parseInt(page) - 1);
      }
      if (searchValue && page && parPage) {
        const categorys = await categoryModel
          .find({
            $text: { $search: searchValue },
          })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalCategory = await categoryModel
          .find({
            $text: { $search: searchValue },
          })
          .countDocuments();
        responseReturn(res, 200, { totalCategory, categorys });
      } else if (searchValue === "" && page && parPage) {
        const categorys = await categoryModel
          .find({})
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalCategory = await categoryModel.find({}).countDocuments();
        responseReturn(res, 200, { totalCategory, categorys });
      } else {
        const categorys = await categoryModel.find({}).sort({ createdAt: -1 });
        const totalCategory = await categoryModel.find({}).countDocuments();
        responseReturn(res, 200, { totalCategory, categorys });
      }
    } catch (error) {
      responseReturn(res, 500, { error: "Internal server error" });
    }
  };
}

module.exports = new categoryController();
