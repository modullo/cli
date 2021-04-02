const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_aws = [
  {
    name: "aws-access-key",
    type: "input",
    message: "Please enter your AWS Access Key",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please enter your AWS Access Key";
      }
    }
  },
  {
    name: "aws-secret-key",
    type: "input",
    message: "Please enter your AWS Secret Key",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please enter your AWS Secret Key";
      }
    }
  }
];
