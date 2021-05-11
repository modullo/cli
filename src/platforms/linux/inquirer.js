const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_linux = [
  {
    name: "machine-host",
    type: "input",
    message: "Please enter your Machine Hostname or IP",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please enter your Machine Hostname or IP";
      }
    }
  },
  {
    name: "machine-username",
    type: "input",
    message: "Please enter your Machine Username",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please enter your Machine Username";
      }
    }
  },
  {
    name: "machine-key-path",
    type: "input",
    message: "Please enter your Machine Private Key Path",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please enter your Machine Private Key Path";
      }
    }
  }
];
