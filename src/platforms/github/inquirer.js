const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_github = [
  {
    name: "repository-description",
    type: "input",
    message: "Please provide a Description for your repository",
    default: "",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please provide a Description for your repository";
      }
    }
  },
  {
    name: "repository-visibility",
    type: "list",
    message: "Do your want your repository private or public",
    choices: ["private", "public"],
    default: "private"
  }
];
