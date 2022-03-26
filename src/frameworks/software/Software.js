const fs = require("fs");
const path = require("path");
const { Spinner, ncp, util, access, params, Str } = require(path.join(
  __dirname,
  "../../lib/actions.js"
));
const chalk = require("chalk");
//const copy = util.promisify(ncp);
//const axios = require("axios");
//const mysql = require("mysql")
//const spawn = require("child_process").spawn;
const inquirer = require("inquirer");
const inquiries = require(path.join(__dirname, "./inquirer.js"));
var _ = require("lodash/core");
const linux = require(path.join(__dirname, "../../platforms/linux/Linux.js"));
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));
const ansible = require(path.join(__dirname, "../ansible/Ansible.js"));

async function cliRequirements(options) {
  if (options.installInteractive) {
    const answers = await inquirer.prompt(inquiries.inquiries_software);
    options.answers = answers;
    return options;
  }
  if (options.installArguments) {
    //lets parse command line arguments
    if (
      options.softwarePackageType == "" ||
      !["single", "stack"].includes(options.softwarePackageType)
    ) {
      options.missingArguments["software-package-type"] =
        "Please enter a Software Package Type - single Package or Stack?";
    } else {
      options.answers["software-package-type"] = options.softwarePackageType;
    }
    let software_packages = params.frameworks.data.software.linux.stacks.concat(
      params.frameworks.data.software.linux.packages
    );
    if (
      options.softwarePackage == "" ||
      !software_packages.includes(options.softwarePackage)
    ) {
      options.missingArguments["software-package"] =
        "Please enter the Software Package";
    } else {
      options.answers["software-package"] = options.softwarePackage;
    }

    return options;
  }
}

exports.cliRequirements = cliRequirements;

async function createInit(options, platform, service = "") {
  const status = new Spinner(
    `Provisioning software to ${service.toUpperCase()} on ${platform.toUpperCase()}...`
  );
  await status.start();
  await status.stop();

  if (platform == "linux" && service == "vm") {
    try {
      // All th ebelow should propably be centralized on Linux to aid re-use. Only the linux.configiInit shouldd be called here
      console.log(
        `%s Generating Ansible Inventory...`,
        chalk.green.bold("Provisioner: ")
      );

      let machineHost = options.machineHost;
      let machineUser = options.machineUsername;
      let machineKeyPath = options.machineKeyPath;
      let yamlPath = options.targetDirectory + `/ansible_inventory.yaml`;

      options.ansibleInventoryPath = yamlPath;

      let yamlConfig = {
        modullo_vm: {
          hosts: {
            [machineHost]: "",
          },
          vars: {
            ansible_ssh_user: machineUser,
            ansible_ssh_private_key_file: machineKeyPath,
          },
        },
      };

      await utilities.writeYAML(
        options,
        yamlConfig,
        yamlPath,
        async function (result) {
          if (result) {
            //process.exit(1);
            console.log(
              `%s Checking connection to Linux`,
              chalk.green.bold("Provisioner: ")
            );
            //configure Linux environment
            await linux.configInit(
              options,
              service,
              async function (initResult) {
                if (initResult) {
                  //console.log(`%s Connection to Machine Succeded`, chalk.green.bold("Provisioner: ") );
                }
              }
            );
          } else {
            //
          }
        }
      );
    } catch (err) {
      console.log("%s Configure error: " + err, chalk.red.bold("Error: "));
      await status.stop();
    }
  }
}

exports.createInit = createInit;

async function provisionSoftware(options, software_slug) {
  const status = new Spinner(
    `Provisioning ${software_slug} to ${
      options.machineHost
    } on ${options.deployPlatform.toUpperCase()}...`
  );
  await status.start();

  //ensure role is installed (using ansible-galaxy)

  await ansible.checkGalaxyRole(
    options,
    software_slug,
    async function (galaxyResult, galaxyData) {
      if (galaxyResult) {
        console.log(galaxyData);

        let ansibleRole = galaxyData["role"];
        let ansibleRolePath = galaxyData["path"];

        //make ansible playbook

        //go ahead and provision
      }
    }
  );
}

exports.provisionSoftware = provisionSoftware;
