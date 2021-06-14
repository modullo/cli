const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_laravel = [
  {
    name: "laravel-version",
    type: "input",
    message: "Please specify the Laravel Version (default is latest)",
    default: "latest",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please specify the Laravel Version (default is latest)";
      }
    }
  }
];
