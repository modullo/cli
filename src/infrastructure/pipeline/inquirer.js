const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_pipeline = [
  {
    name: "pipeline-name",
    type: "input",
    message: "Please provide a Pipeline Name",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please provide a Pipeline Name";
      }
    }
  }
];
