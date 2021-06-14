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
const open = require("open");

async function cliRequirements(options) {
  if (options.installInteractive) {
    const answers = await inquirer.prompt(inquiries.inquiries_laravel);
    options.answers = answers;
    return options;
  }
  if (options.installArguments) {
    //lets parse command line arguments
    if (options.laravelVersion == "") {
      options.missingArguments["laravel-version"] =
        "Please specify the Laravel Version (default is latest)";
    } else {
      options.answers["laravel-version"] = options.laravelVersion;
    }
    return options;
  }
}

exports.cliRequirements = cliRequirements;

async function createInit(options, service = "") {
  let platform = options.deployPlatform;
  const status = new Spinner(
    `Creating Laravel Application Application on ${platform.toUpperCase()}...`
  );
  await status.start();

  if (platform == "aws" && service == "serverless") {
    //configure AWS environment
    await aws.configInit(
      options,
      platform,
      service,
      async function(awsResult) {
        // enter folder
        // clonne repo
        // create new repo
        // copy params into repo
        // cdk deploy

        try {
          //Stack ARN
          //arn:aws:cloudformation:eu-west-1:205958860294:stack/ModulloCreatePipelineAwsStack

          let createLaravelServerlessCommands = `cd ${options.targetDirectory}`;
          createLaravelServerlessCommands += ` && docker run --rm -i --volume $PWD:/app composer create-project --prefer-dist laravel/laravel ./code`;
          createLaravelServerlessCommands += ` && cd code && docker run --rm -i --volume $PWD:/app composer require bref/bref bref/laravel-bridge`;
          createLaravelServerlessCommands += ` && cd ../iaac && cdk init app -l typescript && npm i cdk-serverless-lamp`;

          await utilities.cliSpawnCommand(
            options,
            createLaravelServerlessCommands,
            "CLI",
            {
              message: "Serverless Laravel Initialization Successful",
              catch: true,
              catchStrings: ["All done"]
            },
            {
              message: "Serverless Laravel Initialization Error",
              catch: false,
              catchStrings: ["error"]
            },
            async function(commandResult) {
              if (commandResult) {
                console.log(
                  `%s Serverless Laravel Initialization Done`,
                  chalk.green.bold(`CLI:`)
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
                console.log(`%s Error Initializing`, chalk.red.bold(`CLI:`));
                status.stop();
                process.exit(1);
              }
            }
          );

          status.stop();
        } catch (err) {
          console.log(
            "%s Pipeline Creation error: " + err,
            chalk.red.bold("Error: ")
          );
        }
      },
      "Laravel Framework"
    );
  }
}

exports.createInit = createInit;

async function createPipeline(options, platform, service = "") {
  const status = new Spinner(
    `Creating Pipeline for Wordpress Application on ${platform.toUpperCase()}...`
  );
  await status.start();
  if (options.deployPlatform == "aws" && platform == "cdk") {
    await aws.configInit(options, platform, service); //configure AWS CDK environment
  }

  if (platform == "cdk") {
    let createCDKAppCommannds = `cd ${options.targetDirectory}`;
    createCDKAppCommannds += ` `;

    await utilities.cliSpawn(
      options,
      createCDKAppCommannds,
      "AWS CDK",
      "CDK App Creation Successful",
      "CDK App Creation Error"
    );
  }
}

exports.createPipeline = createPipeline;
