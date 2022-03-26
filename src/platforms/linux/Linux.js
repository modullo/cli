const fs = require("fs");
const path = require("path");
const Listr = require("listr");
const execa = require("execa");
const chalk = require("chalk");
//const clear = require("clear");
//const figlet = require("figlet");
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
    const answers = await inquirer.prompt(inquiries.inquiries_linux);
    options.answers = answers;
    return options;
  }

  if (options.installArguments) {
    if (options.machineHost == "") {
      options.missingArguments["machine-host"] =
        "Please enter your Machine Hostname or IP";
    } else {
      options.answers["machine-host"] = options.machineHost;
    }

    if (options.machineUsername == "") {
      options.missingArguments["machine-username"] =
        "Please enter your Machine Username";
    } else {
      options.answers["machine-username"] = options.machineUsername;
    }

    if (options.machineKeyPath == "") {
      options.missingArguments["machine-key-path"] =
        "Please enter your Machine Private Key Path";
    } else {
      options.answers["machine-key-path"] = options.machineKeyPath;
    }

    return options;
  }
}

exports.cliRequirements = cliRequirements;

function deployRequirements(options, service = "") {
  var count_checks = 0;

  let LinuxReqs = [];

  const requirementsLinux = {
    title: "Linux Automation",
    task: () => {
      return new Listr(LinuxReqs, { concurrent: false });
    },
  };

  return [requirementsLinux, count_checks];
}

exports.deployRequirements = deployRequirements;

async function configInit(options, service = null, callback) {
  const status = new Spinner(
    `Initializing ${options.deployPlatform.toUpperCase()} Activity...`
  );
  status.start();
  status.stop();

  if (service == "vm") {
    let ansiblePingCommand = `cd ${options.targetDirectory} && ansible all -m ping -i ansible_inventory.yaml`; // ${options.ansibleInventoryPath}
    console.log(process.cwd());
    console.log(ansiblePingCommand);
    await utilities.cliSpawnCommand(
      options,
      ansiblePingCommand,
      "Linux",
      {
        message: `Connection to ${options.machineHost} Successful`,
        catch: true,
        catchStrings: ["pong"],
      },
      {
        message: `Connection to ${options.machineHost} Failed`,
        catch: true,
        catchStrings: ["error"],
      },
      callback
    );
  }
}

exports.configInit = configInit;
