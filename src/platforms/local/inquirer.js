const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_local = [
  {
    name: "project-path",
    type: "input",
    message: "Please enter the Local Project Path",
    default: ""
  }
];
