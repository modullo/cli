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
  DescribeInstancesCommand,
  CreateKeyPairCommand,
  CreateTagsCommand,
  RunInstancesCommand,
  DescribeVpcsCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  AuthorizeSecurityGroupEgressCommand,
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
          .then((result) => {
            if (result.stdout.includes("aws-cli")) {
              count_checks++;
            } else {
              throw new Error(
                "AWS CLI not available. Download at https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
              );
            }
          })
          .catch((e) => {
            console.log(e);
            ctx.aws = false;
            throw new Error(
              "AWS CLI not available. Download at https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
            );
          }),
    },
    {
      title: "Checking for AWS ECS CLI",
      task: (ctx, task) =>
        execa("ecs-cli", ["--version"])
          .then((result) => {
            if (result.stdout.includes("ecs-cli")) {
              count_checks++;
            } else {
              throw new Error(
                "AWS ECS CLI not available. Download at https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_CLI_installation.html"
              );
            }
          })
          .catch((e) => {
            console.log(e);
            ctx.aws = false;
            throw new Error(
              "AWS ECS CLI not available. Download at https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_CLI_installation.html"
            );
          }),
    },
  ];

  if (service == "pipeline") {
    AWSReqs.push({
      title: "Checking for AWS CDK",
      task: (ctx, task) =>
        execa("cdk", ["--version"])
          .then((result) => {
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
          .catch((e) => {
            console.log(e);
            ctx.aws = false;
            throw new Error(
              "AWS CDK not available. Learn more at https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html"
            );
          }),
    });
  }

  const requirementsAWS = {
    title: "AWS Automation",
    task: () => {
      return new Listr(AWSReqs, { concurrent: false });
    },
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
      message: "Environment Configuration Successful",
      catch: true,
      catchStrings: ["bootstrapped"],
    },
    {
      message: "Environment Configuration Error",
      catch: false,
      catchStrings: ["error"],
    },
    async function (commandResult) {
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
              message: "Environment Bootstrap Successful",
              catch: true,
              catchStrings: ["bootstrapped"],
            },
            {
              message: "Environment Bootstrap Error",
              catch: true,
              catchStrings: ["error"],
            },
            async function (commandResult) {
              if (commandResult) {
                console.log(`\n`);
                console.log(
                  `%s Proceeding with ${init_caller} creation...`,
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
          console.log(`\n`);
          console.log(
            `%s Proceeding with ${init_caller} creation...`,
            chalk.green.bold(`AWS:`)
          );
          callback(true);
        }
      } else {
        console.log(
          `%s Error Configuring AWS Environment`,
          chalk.red.bold(`AWS CLI:`)
        );
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
    //write Private Key to file

    let homeDir = await utilities.homeDirectory();
    let globalConfigFolder = path.join(homeDir, `.modullo/private_keys`);

    let key_output = `${globalConfigFolder}/${options.deployKeyPair}`;
    await utilities.writeFile(
      options,
      data.KeyMaterial,
      key_output,
      function (writeResponse) {
        if (writeResponse) {
          //chmod file
          fs.chmod(key_output, 0o400, (err) => {
            if (err) {
              console.error(
                `%s Error changing file permission on VM Private Key at ${key_output}`,
                chalk.red.bold(`CLI:`)
              );
              callback(false, "");
            } else {
              console.log(
                `%s VM Private Key successfully writted and secured (chmod 400) at ${key_output}`,
                chalk.green.bold(`CLI:`)
              );
              callback(true, data);
            }
          });
        } else {
          console.error(
            `%s Error writing VM Private Key to ${key_output}`,
            chalk.red.bold(`CLI:`)
          );
          callback(false, "");
        }
      }
    );
  } catch (err) {
    console.log("AWS EC2 Key Pair Error: ", err);
    callback(false, "");
  }
}
exports.createKeyPair = createKeyPair;

async function createEC2(options, callback) {
  const ec2Client = new EC2Client({ region: options.deployAWSRegion });

  // Set the parameters
  const amiIDs = AMIs.getData;
  let AMI_ID = amiIDs[0][options.vmOS][options.deployAWSRegion];

  let SGID;

  //create security group and ingress params

  try {
    // Set the parameters
    const params_vpc = { KeyName: options.deployKeyPair }; //KEY_PAIR_NAME
    let vpc_sg = null;

    const data_vpc = await ec2Client.send(new DescribeVpcsCommand(params_vpc));
    //return data_vpc;
    //vpc_sg = data_vpc.Vpcs[0].VpcId;

    data_vpc.Vpcs.forEach((element) => {
      if (element.IsDefault) {
        vpc_sg = element.VpcId;
      }
    });
    vpc_sg = vpc_sg == null ? data_vpc.Vpcs[0].VpcId : vpc_sg;

    const paramsSecurityGroup = {
      Description: "Modullo VM Security Group", //DESCRIPTION
      GroupName: "ModulloVMSecurityGroup" + Str.random(4), // SECURITY_GROUP_NAME
      VpcId: vpc_sg,
    };

    const data_sg = await ec2Client.send(
      new CreateSecurityGroupCommand(paramsSecurityGroup)
    );
    const SecurityGroupId = data_sg.GroupId;
    SGID = SecurityGroupId;
    //console.log("Success", SecurityGroupId);
    //return data;
    console.log(
      `%s Security Group Created ${SecurityGroupId}`,
      chalk.green.bold(`AWS:`)
    );

    const paramsIngress = {
      GroupId: SecurityGroupId, //SECURITY_GROUP_ID
      IpPermissions: [
        {
          IpProtocol: "tcp",
          FromPort: 80,
          ToPort: 80,
          IpRanges: [{ CidrIp: "0.0.0.0/0" }],
        },
        {
          IpProtocol: "tcp",
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: "0.0.0.0/0" }],
        },
        {
          IpProtocol: "tcp",
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{ CidrIp: "0.0.0.0/0" }],
        },
        {
          IpProtocol: "icmp",
          FromPort: -1,
          ToPort: -1,
          IpRanges: [{ CidrIp: "0.0.0.0/0" }],
        },
      ],
    };
    const dataIngress = await ec2Client.send(
      new AuthorizeSecurityGroupIngressCommand(paramsIngress)
    );
    console.log(
      `%s Security Group Ingress Rules Created ${SecurityGroupId}`,
      chalk.green.bold(`AWS:`)
    );

    // const paramsEgress = {
    //   GroupId: SecurityGroupId, //SECURITY_GROUP_ID
    //   IpPermissions: [
    //     {
    //       IpProtocol: "-1",
    //       FromPort: -1,
    //       ToPort: -1,
    //       IpRanges: [{ CidrIp: "0.0.0.0/0" }],
    //     },
    //   ],
    // };

    // const dataEgress = await ec2Client.send(
    //   new AuthorizeSecurityGroupEgressCommand(paramsEgress)
    // );
    // console.log(
    //   `%s Security Group Egress Rules Created ${SecurityGroupId}`,
    //   chalk.green.bold(`AWS:`)
    // );

    //console.log("Ingress Successfully Set", data);
    //return data;
  } catch (error) {
    console.log("Error Creating Security Group", error);
  }

  const instanceParams = {
    ImageId: AMI_ID, //AMI_ID
    InstanceType: options.deployAWSInstanceType,
    KeyName: options.deployKeyPair, //KEY_PAIR_NAME
    MinCount: 1,
    MaxCount: 1,
    SecurityGroupIds: [`${SGID}`],
  };

  try {
    const dataEC2 = await ec2Client.send(
      new RunInstancesCommand(instanceParams)
    );
    //console.log(data.Instances[0]);
    const instanceId = dataEC2.Instances[0].InstanceId;
    console.log("Created instance", instanceId);

    //Add tags to the instance
    const tagParams = {
      Resources: [instanceId],
      Tags: [
        {
          Key: "ModulloAppID",
          Value: options.modulloAppID,
        },
        {
          Key: "Name",
          Value: options.vmName,
        },
      ],
    };

    try {
      //const ec2Client = new EC2Client({ region: options.deployAWSRegion });
      const dataTag = await ec2Client.send(new CreateTagsCommand(tagParams));
      console.log(`Instance tagged  ModulloAppID: ${options.modulloAppID}`);
    } catch (err) {
      console.log("Error Tagging", err);
      callback(false, err);
    }

    callback(true, dataEC2);
  } catch (err) {
    console.log("Error Creating Instance", err);
    callback(false, err);
  }
}
exports.createEC2 = createEC2;

async function describeEC2(instance_ids, options, callback) {
  try {
    const ec2Client = new EC2Client({ region: options.deployAWSRegion });
    const dataEC2 = await ec2Client.send(
      new DescribeInstancesCommand(instance_ids)
    );
    //console.log("Success", JSON.stringify(data));
    callback(true, dataEC2);
  } catch (err) {
    console.log("Error", err);
    callback(false, err);
  }
}
exports.describeEC2 = describeEC2;
