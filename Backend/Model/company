const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/SIH")
  .then(() => {
    console.log("Mongo connected for company");
  })
  .catch((err) => console.log("error of mongo company : ", err));

const companySchema = new mongoose.Schema({
  CompanyName: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  CompanySize: {
    type: String,
    required: true,
  },
  Industry: {
    type: String,
    required: true,
  },
  Website: {
    type: String,
  },
  ContactPerson: {
    type: String,
    required: true,
  },
  Password: {
    type: String,
    required: true,
  },
  ConPassword: {
    type: String,
    required: true,
  },
});

const companyModel = mongoose.model("company", companySchema);

module.exports = companyModel;
