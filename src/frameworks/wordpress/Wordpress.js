const fs = require("fs");
const path = require("path");
const { Spinner, ncp, util, access, params, Str } = require(path.join(
  __dirname,
  "../../lib/actions.js"
));
const chalk = require("chalk");
const copy = util.promisify(ncp);
const axios = require("axios");
const mysql = require("mysql");
const inquirer = require("inquirer");
const inquiries = require(path.join(__dirname, "./inquirer.js"));
var _ = require("lodash/core");

async function cliRequirements(options) {
  if (options.installInteractive) {
    const answers = await inquirer.prompt(inquiries.inquiries_wordpress);
    return {
      ...options,
      answers
    };
  }
  if (options.installArguments) {
    //lets parse command line arguments
    let optionsArguments = [];
    let missingArguments = {};

    if (
      !options.argEmail ||
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
        options.argEmail
      )
    ) {
      missingArguments["email"] = "Please enter a valid login Email";
    } else {
      optionsArguments["email"] = options.argEmail;
    }
    if (
      !options.argAgreeementTOS ||
      !["yes", "no"].includes(options.argAgreeementTOS)
    ) {
      missingArguments["agreement"] =
        "You need to agree (or disagree) with Terms/Conditions of Use and Privacy Policy available at https://modullo.io/agreement. Enter 'yes' or 'no'";
    } else {
      optionsArguments["agreement"] = options.argAgreeementTOS;
    }

    //console.log(missingArguments);
    //console.log(optionsArguments);

    if (_.size(missingArguments) > 0) {
      console.error(
        "%s The following argument(s) is/are required but either missing OR in the wrong format: ",
        chalk.red.bold("Error")
      );
      Object.keys(missingArguments).forEach(element => {
        console.log(
          `- ${chalk.red.bold(element)}: ${chalk.italic(
            missingArguments[element]
          )}`
        );
      });
      console.log("\n");
      process.exit(1);
    }

    let answers = optionsArguments;

    return {
      ...options,
      answers
    };
  }
}

exports.cliRequirements = cliRequirements;

async function createInit(options) {
  const status = new Spinner("Initializing Wordpress Setup...");
  await status.start();

  if (options.deployPlatform == "aws") {
    //
  }

  return true;
}

exports.createInit = createInit;
