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
const AMIs = require(path.join(__dirname, "./AMIs.js"));

const {
  EC2Client,
  CreateKeyPairCommand,
  CreateTagsCommand,
  RunInstancesCommand
} = require("@aws-sdk/client-ec2");

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

async function configInit(
  options,
  platform,
  service = null,
  callback = null,
  init_caller = null
) {
  const status = new Spinner(
    `Initializing AWS ${platform.toUpperCase()} Deployment...`
  );
  status.start();
  status.stop();

  //let cdkCLIConfigure = `aws configure --profile modullo_pipeline`;
  let cdkCLIConfigure = `export AWS_ACCESS_KEY_ID=${options.deployAWSAccessKey} && export AWS_SECRET_ACCESS_KEY=${options.deployAWSSecretKey} && export AWS_DEFAULT_REGION=${options.deployAWSRegion}`;
  await utilities.cliSpawnCommand(
    options,
    cdkCLIConfigure,
    "AWS CLI",
    {
      message: "Configure Successful",
      catch: true,
      catchStrings: ["bootstrapped"]
    },
    {
      message: "Configure Error",
      catch: false,
      catchStrings: ["error"]
    },
    async function(commandResult) {
      if (commandResult) {
        if (service == "cdk" || service == "serverless") {
          //options.createInfrastructure == "pipeline"

          let cdkBootstrapString = `aws://${options.answers["aws-account-id"]}/${options.answers["aws-region"]}`;

          let cdkBootstrapCommand = `export CDK_NEW_BOOTSTRAP=1 && npx cdk bootstrap --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess ${cdkBootstrapString}`;
          await utilities.cliSpawnCommand(
            options,
            cdkBootstrapCommand,
            "AWS CDK",
            {
              message: "Bootstrap Successful",
              catch: true,
              catchStrings: ["bootstrapped"]
            },
            {
              message: "Bootstrap Error",
              catch: true,
              catchStrings: ["error"]
            },
            async function(commandResult) {
              if (commandResult) {
                console.log(
                  `%s \n Proceeding with ${init_caller} creation...`,
                  chalk.green.bold(`AWS CDK:`)
                );

                callback(true);
              } else {
                console.log(
                  `%s Error Boostrapping`,
                  chalk.red.bold(`AWS CDK:`)
                );
                status.stop();
                process.exit(1);
              }
            }
          );
        } else {
          console.log(
            `%s \n Proceeding with ${init_caller} creation...`,
            chalk.green.bold(`AWS:`)
          );
          callback(true);
        }
      } else {
        console.log(`%s Error Configuring AWS CLI`, chalk.red.bold(`AWS CLI:`));
        status.stop();
        process.exit(1);
      }
    }
  );
}

exports.configInit = configInit;

async function createKeyPair(options, callback) {
  const params = { KeyName: options.deployKeyPair }; //MY_KEY_PAIR
  try {
    const ec2Client = new EC2Client({ region: options.deployAWSRegion });
    //console.log(ec2Client);
    const data = await ec2Client.send(new CreateKeyPairCommand(params));
    //console.log(JSON.stringify(data));
    //return data;
    callback(true, data);
  } catch (err) {
    console.log("AWS EC2 Key Pair Error: ", err);
    callback(false, "");
  }
}
exports.createKeyPair = createKeyPair;

async function createEC2(options, callback) {
  // Set the parameters
  const amiIDs = AMIs.getData;
  let AMI_ID = amiIDs[0][options.vmOS][options.deployAWSRegion];

  const instanceParams = {
    ImageId: AMI_ID, //AMI_ID
    InstanceType: options.deployAWSInstanceType,
    KeyName: options.deployKeyPair, //KEY_PAIR_NAME
    MinCount: 1,
    MaxCount: 1
  };

  try {
    const ec2Client = new EC2Client({ region: options.deployAWSRegion });
    const data = await ec2Client.send(new RunInstancesCommand(instanceParams));
    //console.log(data.Instances[0]);
    const instanceId = data.Instances[0].InstanceId;
    console.log("Created instance", instanceId);
    callback(true, data);
    // Add tags to the instance
    // const tagParams = {
    //     Resources: [instanceId],
    //     Tags: [
    //         {
    //             Key: "Name",
    //             Value: "SDK Sample",
    //         },
    //     ],
    // };
    // try {
    //     const data = await ec2Client.send(new CreateTagsCommand(tagParams));
    //     console.log("Instance tagged");
    // } catch (err) {
    //     console.log("Error", err);
    // }
  } catch (err) {
    console.log("Error", err);
  }

  run();
}
exports.createEC2 = createEC2;
