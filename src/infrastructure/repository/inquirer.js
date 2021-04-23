const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_repository = [
  {
    name: "repository-name",
    type: "input",
    message: "Please provide a Repository Name",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please provide a Repository Name";
      }
    }
  }
];
