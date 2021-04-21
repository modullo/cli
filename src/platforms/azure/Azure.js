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
const { pipeline } = require("stream");
const inquiries = require(path.join(__dirname, "./inquirer.js"));
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));

async function cliRequirements(options) {
  if (options.installInteractive) {
    const answers = await inquirer.prompt(inquiries.inquiries_azure);
    options.answers = answers;
    return options;
  }

  if (
    ![
      "ukwest",
      "uksouth",
      "eastus",
      "westus",
      "southafricanorth",
      "southafricawest",
      "northeurope",
      "westeurope"
    ].includes(options.deployAzureRegion)
  ) {
    options.missingArguments["azure-region"] = "Please enter your Azure Region";
  } else {
    options.answers["azure-region"] = options.deployAzureRegion;
  }

  return options;
}

exports.cliRequirements = cliRequirements;

function deployRequirements(options, service = "") {
  var count_checks = 0;

  let AzureReqs = [
    {
      title: "Checking for Azure CLI",
      task: (ctx, task) =>
        execa("az", ["--version"])
          .then(result => {
            if (result.stdout.includes("azure-cli")) {
              count_checks++;
            } else {
              throw new Error(
                "Azure CLI not available. Download at https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
              );
            }
          })
          .catch(e => {
            console.log(e);
            ctx.aws = false;
            throw new Error(
              "Azure CLI not available. Download at https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
            );
          })
    }
  ];

  const requirementsAzure = {
    title: "AWS Automation",
    task: () => {
      return new Listr(AzureReqs, { concurrent: false });
    }
  };

  return [requirementsAzure, count_checks];
}

exports.deployRequirements = deployRequirements;

async function configInit(options, platform, service = null) {
  const status = new Spinner(
    `Initializing ${platform.toUpperCase()} Activity...`
  );
  status.start();
  status.stop();

  let azureLoginCommand = "az login";
  await utilities.cliSpawnCallback(
    options,
    azureLoginCommand,
    "Azure Login",
    "Azure Login Successful",
    "Azure Login Error",
    async function(loginResult, returnOutput) {
      console.log("CD: " + returnOutput);
      if (loginResult) {
        return true;
      } else {
        return false;
      }
    },
    true,
    "You have logged in"
  );
}

exports.configInit = configInit;
