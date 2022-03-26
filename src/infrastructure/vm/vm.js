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
const { waitForConversionTaskCompleted } = require("@aws-sdk/client-ec2");
const aws = require(path.join(__dirname, "../../platforms/aws/AWS.js"));
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));
const linux = require(path.join(__dirname, "../../platforms/linux/Linux.js"));
const ansible = require(path.join(
  __dirname,
  "../../frameworks/ansible/Ansible.js"
));

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
    if (Str(options.vmName).isEmpty()) {
      options.missingArguments["vm-name"] = "Please specify a Name for your VM";
    } else {
      options.answers["vm-name"] = options.vmName;
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
      async function (awsResult) {
        //console.log("aws result");
        //console.log(awsResult);

        try {
          const kp = await aws.createKeyPair(
            options,
            async function (kpResult, kpData) {
              //$metadata, KeyMaterial, KeyName, KeyPairId
              if (kpResult) {
                await aws.createEC2(
                  options,
                  async function (ec2Result, ec2Data) {
                    if (ec2Result) {
                      let instance_id =
                        ec2Data.Instances[0].InstanceId.toString();
                      console.log(
                        `%s Virtual Machine Creation Complete: ${instance_id}`,
                        chalk.green.bold("AWS: ")
                      );
                      console.log(
                        `%s Virtual Machine Private IP: ${ec2Data.Instances[0].PrivateIpAddress}`,
                        chalk.green.bold("AWS: ")
                      );

                      if (
                        typeof ec2Data.Instances[0].PublicIpAddress ===
                        "undefined"
                      ) {
                        //recheck for updated ip in 10 seconds
                        console.log(
                          `Waiting for 5 seconds for VM ${instance_id} to be fully active...`
                        );
                        await utilities.sleep(5000);
                        await aws.describeEC2(
                          { InstanceIds: [`${instance_id}`] },
                          options,
                          async function (describeResult, describeData) {
                            if (describeResult) {
                              //console.log(describeData)
                              let new_instance =
                                describeData.Reservations[0].Instances[0];
                              console.log(
                                `%s Virtual Machine Public IP: ${new_instance.PublicIpAddress}`,
                                chalk.green.bold("AWS: ")
                              );
                              if (
                                Str(options.withIP).isNotEmpty() &&
                                options.withIP != "0.0.0.0"
                              ) {
                                //attach specified IP
                              }

                              //check for connectivity
                              console.log(
                                `Lets check for connectivity to ${new_instance.PublicIpAddress}...`
                              );

                              if (options.vmOS == "ubuntu") {
                                options.machineHost =
                                  new_instance.PublicIpAddress;
                                options.machineUsername = `ubuntu`;

                                let homeDir = await utilities.homeDirectory();
                                let globalConfigFolder = path.join(
                                  homeDir,
                                  `.modullo/`
                                );
                                options.machineKeyPath = `${globalConfigFolder}private_keys/${options.deployKeyPair}`;

                                // create Ansible Inventory
                                let inventoryPath =
                                  options.targetDirectory +
                                  `/ansible_inventory.yaml`;

                                ansible.makeInventory(
                                  options,
                                  "machine",
                                  "",
                                  inventoryPath,
                                  async function (inventoryResult) {
                                    if (inventoryResult) {
                                      options.ansibleInventoryPath =
                                        inventoryPath;

                                      //provision with web server

                                      //and finally test for connectivity
                                      // await linux.configInit(options, options.createInfrastructure, inventoryPath, async function(initResult) {
                                      //     if (initResult) {
                                      //         console.log(`%s Connection to Machine Succeded`, chalk.green.bold("Linux: "));
                                      //       } else {
                                      //           console.error(`%s Failed to Connect to Machine`, chalk.red.bold("Linux: "));
                                      //       }
                                      //     });
                                    } else {
                                      console.log(
                                        `%s Error creating Ansible Inventory`,
                                        chalk.green.bold("Linux: ")
                                      );
                                    }
                                  }
                                );
                              }
                            } else {
                              console.error("Error Retrieving EC2 Information");
                            }
                          }
                        );
                      } else {
                        console.log(
                          `Public IP is: ${ec2Data.Instances[0].PublicIpAddress}`
                        );
                      }
                    } else {
                      //console.log("Error EC2 Generation")
                    }
                  }
                );
              } else {
                //console.log("Error KeyPair Generation")
              }
            }
          );

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
