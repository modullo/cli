const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_wordpress = [
  {
    name: "app_name",
    type: "input",
    message: "Please enter your App Name",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please enter your App Name";
      }
    }
  }
];
