const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_containerRegistry = [
  {
    name: "registry-name",
    type: "input",
    message: "Please provide a Registry Name",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please provide a Registry Name";
      }
    }
  }
];
