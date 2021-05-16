const fs = require("fs");
const path = require("path");
const Listr = require("listr");
const execa = require("execa");
const chalk = require("chalk");
const spawn = require("child_process").spawn;
const { Spinner, ncp, util, access, params, Str } = require(path.join(
  __dirname,
  "../../lib/actions.js"
));
var _ = require("lodash/core");
const inquirer = require("inquirer");
//const { pipeline } = require("stream");
const inquiries = require(path.join(__dirname, "./inquirer.js"));
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));

async function cliRequirements(options) {
  if (options.installInteractive) {
    const answers = await inquirer.prompt(inquiries.inquiries_local);
    options.answers = answers;
    return options;
  }

  if (options.installArguments) {
    if (options.projectPath == "") {
      //options.missingArguments["project-path"] = "Please enter enter the Local Project Path";
      options.answers["project-path"] = options.targetDirectory;
    } else {
      options.answers["project-path"] = options.projectPath;
    }
    if (options.projectPort == "") {
      //options.missingArguments["project-path"] = "Please enter enter the Local Project Path";
      options.answers["project-port"] = options.targetDirectory;
    } else {
      options.answers["project-port"] = options.projectPort;
    }

    return options;
  }
}

exports.cliRequirements = cliRequirements;

function deployRequirements(options, service = "") {
  var count_checks = 0;

  let LocalReqs = [];

  const requirementsLocal = {
    title: "Local Automation",
    task: () => {
      return new Listr(LocalReqs, { concurrent: false });
    }
  };

  return [requirementsLocal, count_checks];
}

exports.deployRequirements = deployRequirements;

async function configInit(options, platform, service = null) {
  const status = new Spinner(
    `Initializing Local ${platform.toUpperCase()} Deployment...`
  );
  status.start();
  status.stop();
}

exports.configInit = configInit;
