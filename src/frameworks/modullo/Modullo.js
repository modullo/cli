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
const spawn = require("child_process").spawn;
const inquirer = require("inquirer");
const inquiries = require(path.join(__dirname, "./inquirer.js"));
var _ = require("lodash/core");
const aws = require(path.join(__dirname, "../../platforms/aws/AWS.js"));
const local = require(path.join(__dirname, "../../platforms/local/Local.js"));
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));

async function cliRequirements(options) {
  if (options.installInteractive) {
    const answers = await inquirer.prompt(inquiries.inquiries_modullo);
    options.answers = answers;

    return options;
  }
  if (options.installArguments) {
    //lets parse command line arguments
    if (options.appName == "") {
      options.missingArguments["app"] = "Please provide an App Name";
    } else {
      options.answers["app"] = options.appName;
    }

    if (
      !options.argTemplate ||
      !["production", "development"].includes(options.argTemplate)
    ) {
      options.missingArguments["template"] =
        "Template must be either 'production' or 'development'";
    } else {
      options.answers["template"] = options.argTemplate;
    }
    if (!options.argFirstname) {
      options.missingArguments["firstname"] = "Please enter your First Name";
    } else {
      options.answers["firstname"] = options.argFirstname;
    }
    if (!options.argLastname) {
      options.missingArguments["lastname"] = "Please enter your Last Name";
    } else {
      options.answers["lastname"] = options.argLastname;
    }
    if (!options.argPassword || options.argPassword.length < 8) {
      options.missingArguments["password"] =
        "Please enter your Login Password (8 characters minimum)";
    } else {
      options.answers["password"] = options.argPassword;
    }
    if (!options.argDomain) {
      options.answers["domain"] =
        options.argTemplate == "production"
          ? params.general.default_domain_production
          : params.general.default_domain_development;
    } else {
      options.answers["domain"] = options.argDomain;
    }
    if (!options.argDNS || !["dns", "localhost"].includes(options.argDNS)) {
      options.missingArguments["dns"] =
        "Specify if installation be served using the Domain Name 'dns' or 127.0.0.1 'localhost'";
    } else {
      options.answers["dns"] = options.argDNS;
    }
    if (
      !options.argDNSResolver ||
      !["valet"].includes(options.argDNSResolver)
    ) {
      options.missingArguments["dns_resolver"] =
        "Kindly choose an applicable DNS Resolver for automatic configuration such as 'valet'";
    } else {
      options.answers["dns_resolver"] = options.argDNSResolver;
    }

    return options;
  }
}

exports.cliRequirements = cliRequirements;

async function createInit(options, platform, service = "") {
  const status = new Spinner(
    `Creating Wordpress Application on ${platform.toUpperCase()}...`
  );
  await status.start();

  try {
    await access(options.templateDirectory, fs.constants.R_OK);

    await utilities.setupInstallationENV(options);

    await utilities.downloadFiles(options, "core"); //start the trio of activities - core, hub and then installing containers

    status.stop();
  } catch (err) {
    console.error(
      "%s Error Initializing Installation: " + err,
      chalk.red.bold("ERROR")
    );
    await status.stop();
    process.exit(1);
  }

  return true;
}

exports.createInit = createInit;
