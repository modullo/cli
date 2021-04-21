const fs = require("fs");
const path = require("path");
const { Spinner, ncp, util, access, params, Str } = require(path.join(
  __dirname,
  "../../lib/actions.js"
));
const chalk = require("chalk");
const spawn = require("child_process").spawn;
const inquirer = require("inquirer");
const inquiries = require(path.join(__dirname, "./inquirer.js"));
var _ = require("lodash/core");
const aws = require(path.join(__dirname, "../../platforms/aws/AWS.js"));
const azure = require(path.join(__dirname, "../../platforms/azure/Azure.js"));
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));

async function cliRequirements(options) {
  if (options.installInteractive) {
    const answers = await inquirer.prompt(
      inquiries.inquiries_containerRegistry
    );
    options.answers = answers;
    return options;
  }
  if (options.installArguments) {
    //lets parse command line arguments
    if (options.registryName == "") {
      options.missingArguments["registry-name"] =
        "Please provide a Registry Name";
    } else {
      options.answers["registry-name"] = options.registryName;
    }

    return options;
  }
}

exports.cliRequirements = cliRequirements;

async function createInit(options, platform, service = "") {
  if (platform == "") {
    platform = options.deployPlatform;
  }
  const status = new Spinner(
    `Creating Container Registry on ${platform.toUpperCase()}...`
  );
  status.start();

  if (platform == "azure") {
    try {
      //let login = await azure.configInit(options, "", ""); //configure Azure environment
      let login = true;

      if (login) {
        let resourceGroup = "modulloResourceGroup";

        let createResourceGroupCommand = `az login && az group create --name ${resourceGroup} --location ${options.deployAzureRegion}`;
        createResourceGroupCommand += ` `;

        await utilities.cliSpawnCallback(
          options,
          createResourceGroupCommand,
          "Azure",
          "Azure Resource Group Creation Successful",
          "Azure Resource Group Creation Error",
          async function(resourceGroupResult, resultString = "") {
            if (resourceGroupResult) {
              let createContainerRegistryCommand = `az acr create --resource-group ${resourceGroup} --name ${options.registryName} --sku Basic`;
              await utilities.cliSpawn(
                options,
                createContainerRegistryCommand,
                "Azure",
                "Azure Container Registry Creation Successful",
                "Azure Container Registry Creation Error"
              );
            }
          }
        );
      }

      status.stop();
    } catch (err) {
      console.log(
        "%s Registry Container Creation error: " + err,
        chalk.red.bold("Error: ")
      );
    }
  }

  //return true;
}

exports.createInit = createInit;
