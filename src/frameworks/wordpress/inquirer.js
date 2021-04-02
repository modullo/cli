const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_wordpress = [
  {
    name: "site_title",
    type: "input",
    message: "Please enter your Website Title",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please enter your Website Title";
      }
    }
  }
];
