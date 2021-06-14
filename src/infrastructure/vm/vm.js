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
    if (Str(options.vmOS).isEmpty()) {
      options.missingArguments["vm-os"] =
        "Please specify a VM Operating System";
    } else {
      options.answers["vm-os"] = options.vmOS;
    }

    return options;
  }
}

exports.cliRequirements = cliRequirements;

async function createInit(options, service = "") {
  let platform = options.deployPlatform;

  const status = new Spinner(
    `Creating Virtual Machine on ${platform.toUpperCase()}...`
  );
  //status.start();

  if (platform == "aws") {
    if (!params.infrastructure.data.vm.params.os.includes(options.vmOS)) {
      console.error(
        `%s Deploying AWS VMs with the ${options.vmOS.toUpperCase()} OS is currently not supported!`,
        chalk.red.bold("VM: ")
      );
      process.exit(1);
    }

    if (
      !params.infrastructure.data.vm.params.regions.includes(
        options.deployAWSRegion
      )
    ) {
      console.error(
        `%s Deploying AWS VMs to the ${options.deployAWSRegion} Region is currently not supported!`,
        chalk.red.bold("VM: ")
      );
      process.exit(1);
    }

    //configure AWS environment
    await aws.configInit(
      options,
      platform,
      service,
      async function(awsResult) {
        //console.log("aws result");
        //console.log(awsResult);

        try {
          const kp = await aws.createKeyPair(options, async function(
            kpResult,
            kpData
          ) {
            //$metadata, KeyMaterial, KeyName, KeyPairId
            if (kpResult) {
              await aws.createEC2(options, async function(ec2Result, ec2Data) {
                //console.log(ec2Data);
                // Platform: undefined,
                // PrivateDnsName: 'ip-172-31-9-18.eu-west-1.compute.internal',
                // PrivateIpAddress: '172.31.9.18',
                // ProductCodes: [],
                // PublicDnsName: '',
                // PublicIpAddress: undefined,
                // RamdiskId: undefined,
                // State: { Code: 0, Name: 'pending' },
              });
            } else {
              //console.log("Error KeyPair Generation")
            }
          });

          status.stop();
        } catch (err) {
          console.log(
            "%s VM Creation error: " + err,
            chalk.red.bold("Error: ")
          );
        }
      },
      "VM Infrastructure"
    );
  }

  //return true;
}

exports.createInit = createInit;
