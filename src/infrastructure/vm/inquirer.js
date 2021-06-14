const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_pipeline = [
  {
    name: "vm-os",
    type: "input",
    message: "Please specify a VM Operating System",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please specify a VM Operating System";
      }
    }
  }
];
