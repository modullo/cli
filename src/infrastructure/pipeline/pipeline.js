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
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));

async function cliRequirements(options) {
  if (options.installInteractive) {
    const answers = await inquirer.prompt(inquiries.inquiries_pipeline);
    options.answers = answers;
    return options;
  }
  if (options.installArguments) {
    //lets parse command line arguments
    if (Str(options.pipelineName).isEmpty()) {
      options.missingArguments["pipeline-name"] =
        "Please provide a Pipeline Name";
    } else {
      options.answers["pipeline-name"] = options.pipelineName;
    }

    return options;
  }
}

exports.cliRequirements = cliRequirements;

async function createInit(options, service = "") {
  let platform = options.deployPlatform;

  const status = new Spinner(
    `Creating Pipeline on ${platform.toUpperCase()}...`
  );
  //status.start();

  if (platform == "aws") {
    //configure AWS environment
    await aws.configInit(options, platform, service, async function(awsResult) {
      // pipeline stack
      // project stack

      //create modullo params
      // clonne repo
      // create new repo
      // copy params into repo
      // cdk deploy

      console.log("aws result");
      console.log(awsResult);

      try {
        //Stack ARN
        //arn:aws:cloudformation:eu-west-1:205958860294:stack/ModulloCreatePipelineAwsStack

        // let login = awsResult;

        // if (login) {
        //   let resourceGroup = "modulloResourceGroup";

        //   let createResourceGroupCommand = `az login && az group create --name ${resourceGroup} --location ${options.deployAzureRegion}`;
        //   createResourceGroupCommand += ` `;

        //   await utilities.cliSpawnCallback(
        //     options,
        //     createResourceGroupCommand,
        //     "Azure",
        //     "Azure Resource Group Creation Successful",
        //     "Azure Resource Group Creation Error",
        //     async function(resourceGroupResult, resultString = "") {
        //       if (resourceGroupResult) {
        //         let createContainerRegistryCommand = `az acr create --resource-group ${resourceGroup} --name ${options.registryName} --sku Basic`;
        //         await utilities.cliSpawn(
        //           options,
        //           createContainerRegistryCommand,
        //           "Azure",
        //           "Azure Container Registry Creation Successful",
        //           "Azure Container Registry Creation Error"
        //         );
        //       }
        //     }
        //   );
        // }

        status.stop();
      } catch (err) {
        console.log(
          "%s Pipeline Creation error: " + err,
          chalk.red.bold("Error: ")
        );
      }
    });
  }

  //return true;
}

exports.createInit = createInit;
