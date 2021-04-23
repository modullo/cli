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
    const answers = await inquirer.prompt(inquiries.inquiries_aws);
    options.answers = answers;
    return options;
  }

  if (options.installArguments) {
    if (options.deployAWSAccountID == "") {
      options.missingArguments["aws-account-id"] =
        "Please enter your AWS Account ID";
    } else {
      options.answers["aws-account-id"] = options.deployAWSAccountID;
    }

    if (options.deployAWSAccessKey == "") {
      options.missingArguments["aws-access-key"] =
        "Please enter your AWS Access Key";
    } else {
      options.answers["aws-access-key"] = options.deployAWSAccessKey;
    }

    if (options.deployAWSSecretKey == "") {
      options.missingArguments["aws-secret-key"] =
        "Please enter your AWS Secret Key";
    } else {
      options.answers["aws-secret-key"] = options.deployAWSSecretKey;
    }

    if (!["us-west-1", "eu-west-1"].includes(options.deployAWSRegion)) {
      options.missingArguments["aws-region"] = "Please enter your AWS Region";
    } else {
      options.answers["aws-region"] = options.deployAWSRegion;
    }

    if (options.deployAWSInstanceType == "") {
      options.missingArguments["aws-instance-type"] =
        "Please enter your AWS Instance Type";
    } else {
      options.answers["aws-instance-type"] = options.deployAWSInstanceType;
    }

    if (options.deployAWSInstanceSize == "") {
      options.missingArguments["aws-instance-size"] =
        "Please enter your AWS Instance Size";
    } else {
      options.answers["aws-instance-size"] = options.deployAWSInstanceSize;
    }

    if (options.deployKeyPair == "") {
      options.missingArguments["keypair"] = "Please enter your KeyPair";
    } else {
      options.answers["keypair"] = options.deployKeyPair;
    }

    return options;
  }
}

exports.cliRequirements = cliRequirements;

function deployRequirements(options, service = "") {
  var count_checks = 0;

  let AWSReqs = [
    {
      title: "Checking for AWS CLI",
      task: (ctx, task) =>
        execa("aws", ["--version"])
          .then(result => {
            if (result.stdout.includes("aws-cli")) {
              count_checks++;
            } else {
              throw new Error(
                "AWS CLI not available. Download at https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
              );
            }
          })
          .catch(e => {
            console.log(e);
            ctx.aws = false;
            throw new Error(
              "AWS CLI not available. Download at https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
            );
          })
    },
    {
      title: "Checking for AWS ECS CLI",
      task: (ctx, task) =>
        execa("ecs-cli", ["--version"])
          .then(result => {
            if (result.stdout.includes("ecs-cli")) {
              count_checks++;
            } else {
              throw new Error(
                "AWS ECS CLI not available. Download at https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_CLI_installation.html"
              );
            }
          })
          .catch(e => {
            console.log(e);
            ctx.aws = false;
            throw new Error(
              "AWS ECS CLI not available. Download at https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_CLI_installation.html"
            );
          })
    }
  ];

  if (service == "pipeline") {
    AWSReqs.push({
      title: "Checking for AWS CDK",
      task: (ctx, task) =>
        execa("cdk", ["--version"])
          .then(result => {
            if (
              result.stdout.includes(".") &&
              result.stdout.includes("build")
            ) {
              count_checks++;
            } else {
              throw new Error(
                "AWS CDK not available. Learn more at https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html"
              );
            }
          })
          .catch(e => {
            console.log(e);
            ctx.aws = false;
            throw new Error(
              "AWS CDK not available. Learn more at https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html"
            );
          })
    });
  }

  const requirementsAWS = {
    title: "AWS Automation",
    task: () => {
      return new Listr(AWSReqs, { concurrent: false });
    }
  };

  return [requirementsAWS, count_checks];
}

exports.deployRequirements = deployRequirements;

async function configInit(options, platform, service = null) {
  const status = new Spinner(
    `Initializing AWS ${platform.toUpperCase()} Deployment...`
  );
  status.start();
  status.stop();

  if (service == "pipeline") {
    let cdkBootstrapString = `aws://${options.answers["aws-account-id"]}/${options.answers["aws-region"]}`;
    //cdk bootstrap aws://ACCOUNT-NUMBER-1/REGION-1
    let cdkBootstrapCommand = "cdk bootstrap";
    await utilities.cliSpawn(
      options,
      cdkBootstrapCommand,
      "AWS CDK",
      "CDK Bootstrap Successful",
      "CDK Bootstrap Error"
    );
  }

  if (platform == "cdk") {
    let createCDKAppCommannds = `cd ${options.targetDirectory}`;
    createCDKAppCommannds += ` && cdk init app --language javascript`;
    //after, install required libraries e.g npm install @aws-cdk/aws-s3 @aws-cdk/aws-lambda
    await utilities.cliSpawn(
      options,
      createCDKAppCommannds,
      "AWS CDK",
      "CDK App Creation Successful",
      "CDK App Creation Error"
    );
  }
}

exports.configInit = configInit;
