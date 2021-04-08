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
const inquiries = require(path.join(__dirname, "./inquirer.js"));
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));

async function cliRequirements(options) {
  if (options.installInteractive) {
    console.log("int a");
    const answers = await inquirer.prompt(inquiries.inquiries_aws);
    options.answers = answers;
    console.log(options);
    return options;
  }
  if (options.installArguments) {
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

function deployRequirements(options) {
  var count_checks = 0;
  const requirementsHeroku = {
    title: "AWS Automation",
    task: () => {
      return new Listr(
        [
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
        ],
        { concurrent: false }
      );
    }
  };

  return [requirementsHeroku, count_checks];
}

exports.deployRequirements = deployRequirements;

async function configInit(options, platform) {
  const status = new Spinner(
    `Initializing AWS ${platform.toUpperCase()} Deployment...`
  );
  status.start();
  status.stop();
}

exports.configInit = configInit;
