const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_software = [
  {
    name: "software-package-type",
    type: "list",
    message: "Please select a Software Package Type - single Package or Stack?",
    choices: ["stack", "single"],
    default: "single"
  },
  {
    name: "software-package",
    type: "list",
    message: "Please select the Software Package",
    choices: params.frameworks.data.software.linux.packages,
    default: "custom",
    when: answers => answers["software-package-type"] === "single"
  },
  {
    name: "software-package",
    type: "list",
    message: "Please select the Software Stack",
    choices: params.frameworks.data.software.linux.stacks,
    default: "lemp",
    when: answers => answers["software-package-type"] === "stack"
  }
];
