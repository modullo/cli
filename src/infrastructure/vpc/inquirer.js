const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_vpc = [
  {
    name: "vpc-name",
    type: "input",
    message: "Please specify number of VPC Name",
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please specify number of VPC Name";
      }
    },
  },
];
