const path = require("path");
const params = require(path.join(__dirname, "../../lib/params.js"));

exports.inquiries_azure = [
  {
    name: "aws-account-id",
    type: "input",
    message: "Please enter your AWS Account ID",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please enter your AWS Account ID";
      }
    }
  },
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
  },
  {
    name: "aws-region",
    type: "list",
    message: "Please select your AWS Region? ",
    choices: ["us-west-1", "eu-west-1"],
    default: "us-west-1"
  },
  {
    name: "keypair",
    type: "input",
    message: "Please enter your AWS Keypair Name",
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Required! Please enter your your AWS Keypair Name";
      }
    }
  },
  {
    name: "instance-type",
    type: "list",
    message: "Please select your AWS EC2 Instance Type? ",
    choices: ["t2.micro", "t2.medium"],
    default: "t2.micro"
  },
  {
    name: "instance-size",
    type: "list",
    message: "Please select your AWS EC2 Instance Size? ",
    choices: ["1", "2", "3", "4", "5", "6"],
    default: "1"
  }
];
