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
    await aws.configInit(
      options,
      platform,
      service,
      async function(awsResult) {
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

          // initialize new CDK or download repo
          $init_mode = "new"; //new or repo

          if ($init_mode == "repo") {
            //download from repo
          }

          if ($init_mode == "new") {
            let createCDKAppCommannds = `cd ${options.targetDirectory}`;
            createCDKAppCommannds += ` && cdk init app --language javascript`;
            //after, install required libraries e.g npm install @aws-cdk/aws-s3 @aws-cdk/aws-lambda
            await utilities.cliSpawnCommand(
              options,
              createCDKAppCommannds,
              "AWS CDK",
              {
                message: "Initialization Successful",
                catch: true,
                catchStrings: ["All done"]
              },
              {
                message: "Initialization Error",
                catch: true,
                catchStrings: ["error"]
              },
              async function(commandResult) {
                if (commandResult) {
                  console.log(
                    `%s Successfully Initialized`,
                    chalk.green.bold(`AWS CDK:`)
                  );
                  // The `cdk.json` file tells the CDK Toolkit how to execute your app. The build step is not required when using JavaScript.

                  // ## Useful commands

                  //  * `npm run test`         perform the jest unit tests
                  //  * `cdk deploy`           deploy this stack to your default AWS account/region
                  //  * `cdk diff`             compare deployed stack with current state
                  //  * `cdk synth`            emits the synthesized CloudFormation template

                  status.stop();
                  process.exit(1);
                } else {
                  console.log(`%s Error Initializing`, chalk.red.bold(`CDK:`));
                  status.stop();
                  process.exit(1);
                }
              }
            );
          }

          status.stop();
        } catch (err) {
          console.log(
            "%s Pipeline Creation error: " + err,
            chalk.red.bold("Error: ")
          );
        }
      },
      "Pipeline Infrastructure"
    );
  }

  //return true;
}

exports.createInit = createInit;
