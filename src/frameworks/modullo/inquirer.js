const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_modullo = [
  {
    name: "app",
    type: "input",
    message: "Please enter your App Name",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please enter your App Name";
      }
    }
  },
  {
    name: "template",
    type: "list",
    message: "What version of the Business Edition do you wish to install? ",
    choices: ["production", "development"],
    default: "production"
  },
  {
    name: "firstname",
    type: "input",
    message: "Please enter your First Name",
    when: answers =>
      answers.template === "production" || answers.template === "development",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please enter your First Name ";
      }
    }
  },
  {
    name: "lastname",
    type: "input",
    message: "Please enter your Last Name ",
    when: answers =>
      answers.template === "production" || answers.template === "development",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please enter your First Name ";
      }
    }
  },
  {
    name: "email",
    type: "input",
    message:
      "Please enter your Email Address (will be used as Admin/Login account) ",
    validate: function(value) {
      if (value.length) {
        if (
          /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
            value
          )
        ) {
          return true;
        } else {
          return "Check! Please enter a valid Email Address ";
        }
      } else {
        return "Required! Please enter your Email Address ";
      }
    }
  },

  {
    name: "password",
    type: "password",
    message: "Please enter your Login Password (8 characters minimum)",
    validate: function(value) {
      if (value.length && value.length >= 8) {
        return true;
      } else {
        return "Required! Please enter your Login Password (8 characters minimum)";
      }
    }
  },
  {
    name: "domain",
    type: "input",
    message: "Enter a Domain Name for this installation",
    when: answers =>
      answers.template === "production" || answers.template === "development",
    default: params.general.default_domain,
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Enter a Domain Name for this installation";
      }
    }
  },
  {
    name: "dns",
    type: "list",
    message:
      "Should the installation be served using the Domain Name (DNS) or Localhost (127.0.0.1) (default)?",
    choices: [
      {
        name: "Domain Name (DNS)",
        value: "dns"
      },
      {
        name: "Localhost (127.0.0.1)",
        value: "localhost"
      }
    ],
    default: "dns"
  },
  {
    name: "dns_resolver",
    type: "list",
    message:
      "Kindly choose an applicable DNS Resolver for automatic configuration",
    when: answers => answers.dns === "dns",
    choices: [
      {
        name: "Valet (DnsMasq)",
        value: "valet"
      },
      {
        name: "Nginx",
        value: "nginx"
      }
    ],
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Kindly choose an applicable DNS Resolver for automatic configuration";
      }
    }
  }
];
