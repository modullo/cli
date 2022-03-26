const fs = require("fs");
const path = require("path");
const { Spinner, ncp, util, access, params, Str } = require(path.join(
  __dirname,
  "../../lib/actions.js"
));
const chalk = require("chalk");
const copy = util.promisify(ncp);
//const axios = require("axios");
//const mysql = require("mysql");
const spawn = require("child_process").spawn;
const inquirer = require("inquirer");
const inquiries = require(path.join(__dirname, "./inquirer.js"));
var _ = require("lodash/core");
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));

async function updateRole(
  options,
  role_name,
  role_config,
  role_config_data,
  callback
) {
  const status = new Spinner(`Updating the role ${role_name}...`);
  await status.start();

  console.log(`%s Copying Ansible Role...`, chalk.green.bold("Ansible: "));

  if (params.frameworks.data.ansible.roles.includes(role_name)) {
    // CHECKING ROLE
    const fullPathName = __dirname + "/main.js";
    const roleDir = path.resolve(
      fullPathName.substr(fullPathName.indexOf("/")),
      "../roles/",
      `${role_name}`
    );

    // CREATE ROLE FOLDER (IF DOESNT EXIST)
    let roleDirAnsible =
      options.targetDirectory + "/ansible/roles/" + `${role_name}`;
    if (!fs.existsSync(roleDirAnsible)) {
      fs.mkdirSync(`${roleDirAnsible}`, { recursive: true }, (err) => {
        if (err) {
          console.log(
            `%s Unable to create Role Directory \n`,
            chalk.blueBright.bold("Ansible: ")
          );
          process.exit(1);
        }
      });

      await copy(roleDir, `${roleDirAnsible}`, {
        clobber: false,
      });
    }

    // COPY ROLE FOLDER (IF DOESNT EXIST)
    //let roleDirAnsibleRole = options.targetDirectory + '/ansible/roles/' + `${role_name}`;

    // if (!fs.existsSync(roleDirAnsible)) {
    //   await copy(roleDir, `${roleDirAnsible}`, {
    //     clobber: false
    //   });
    // }

    // ABOVE APPEARS REDUNDANT

    // UPDATE ROLES
    callback(true);

    // if (result) {
    //   callback(true);
    // } else {
    //   callback(false);
    // }
  } else {
    console.log(`%s Invalid Role...`, chalk.orange.bold("Ansible: "));
  }

  await status.stop();
}

exports.updateRole = updateRole;

async function makePlaybook(options, config_name, config_type, config_data) {
  const status = new Spinner(
    `Making an Ansible Playbook for ${config_data} ${config_type.toUpperCase()}...`
  );
  await status.start();
  await status.stop();

  console.log(
    `%s Generating Ansible Playbook...`,
    chalk.green.bold("Ansible: ")
  );

  if (config_type == "role") {
    // - hosts: "{{ deploy_hosts }}"
    //   remote_user: ubuntu
    //   become: true
    //   tasks:
    //     - name: Re-Install Additional Libs
    //       include_role:
    //         name: setup
    //       vars:
    //         sys_packages: ['build-essential','libffi-dev','libssl-dev','python-apt','python-dev','python-pycurl']
    //       tags:
    //         - post_wildcard
    //       when: vhost_ssl_wildcard
  }
  let machineHost = options.machineHost;
  let machineUser = options.machineUsername;
  let machineKeyPath = options.machineKeyPath;
  let yamlPath = options.targetDirectory + `/ansible_inventory.yaml`;

  options.ansibleInventoryPath = yamlPath;

  let yamlConfig = {
    "-hosts": ``,
    vars: {
      ansible_ssh_user: machineUser,
      ansible_ssh_private_key_file: machineKeyPath,
    },
  };

  await utilities.writeYAML(
    options,
    yamlConfig,
    yamlPath,
    async function (result) {
      if (result) {
        callback(true);
      } else {
        callback(false);
      }
    }
  );
}

exports.makePlaybook = makePlaybook;

async function makeInventory(
  options,
  inventory_type,
  inventory_body,
  inventory_path,
  callback
) {
  console.log(
    `%s Generating Ansible Inventory...`,
    chalk.green.bold("Ansible: ")
  );

  let inventoryConfig, inventoryPath;

  if (inventory_type == "machine") {
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

    inventoryConfig = yamlConfig;

    inventoryPath = yamlPath;

    await utilities.writeYAML(
      options,
      inventoryConfig,
      inventoryPath,
      async function (result) {
        if (result) {
          callback(true);
        } else {
          callback(false);
        }
      }
    );
  } else {
    inventoryConfig = inventory_body;

    inventoryPath = inventory_path;

    await utilities.writeFile(
      options,
      inventoryConfig,
      inventoryPath,
      async function (result) {
        if (result) {
          callback(true);
        } else {
          callback(false);
        }
      }
    );
  }
}

exports.makeInventory = makeInventory;

async function checkGalaxyRole(options, software_slug, callback) {
  const status = new Spinner(
    `Provisioning ${software_slug} to ${
      options.machineHost
    } on ${options.deployPlatform.toUpperCase()}...`
  );
  await status.start();

  //ensure role is installed (using ansible-galaxy)

  if (
    !params.frameworks.data.software.linux.packages.includes(software_slug) ||
    typeof params.frameworks.data.ansible.software[software_slug][
      "galaxy-role"
    ] === undefined
  ) {
    console.error(
      `%s Sofware Package (${software_slug}) appears not yet supported by Modullo`,
      chalk.red.bold("Software")
    );
    await status.stop();
    process.exit(1);
  }

  let galaxyRole = `${params.frameworks.data.ansible.software[software_slug]["galaxy-role"]}`;
  let ansibleGalaxyCommand = `ansible-galaxy install ${galaxyRole}`;

  let galaxyData = [];
  galaxyData["role"] = galaxyRole;
  let homeDir = await utilities.homeDirectory();
  let globalAnsibleFolder = path.join(homeDir, `.ansible/`);
  galaxyData["path"] = `${globalAnsibleFolder}roles/${galaxyRole}`;

  await utilities.cliSpawnCommand(
    options,
    ansibleGalaxyCommand,
    "Ansible",
    {
      message: `Installation of Galaxy Role (${galaxyRole}) Successful`,
      catch: true,
      catchStrings: ["pong"],
    },
    {
      message: `Installation of Galaxy Role (${galaxyRole}) Failed`,
      catch: true,
      catchStrings: ["error"],
    },
    callback(true, galaxyData)
  );
}

exports.checkGalaxyRole = checkGalaxyRole;

async function makeAnsibleHost(options, name, callback) {
  // [dorcas_api]
  // 10.0.72.7
  // [dorcas_api:vars]
  // ansible_python_interpreter=/usr/bin/python3
  // ansible_ssh_user=ubuntu
  // ansible_ssh_private_key_file=~/.ssh/dorcas-key
  //ensure role is installed (using ansible-galaxy)
}

exports.makeAnsibleHost = makeAnsibleHost;

async function runPlaybook(
  options,
  playbookInventory,
  playbookFile,
  playbookVaultExpression,
  callback
) {
  //ansible-playbook -i ansibled.inventory vpc.yml --vault-password-file ansibled.vault

  let ansiblePlaybookCommand = `ansible-playbook -i ${playbookInventory} ${playbookFile} ${playbookVaultExpression}`;
  //let ansiblePlaybookCommand = `pwd`;

  await utilities.cliSpawnCommand(
    options,
    ansiblePlaybookCommand,
    "Ansible",
    {
      message: `Execution of Playbook (${playbookFile}) Successful`,
      catch: true,
      catchStrings: ["pong"],
    },
    {
      message: `Execution of Playbook (${playbookFile}) Failed`,
      catch: true,
      catchStrings: ["ERROR", "error"],
    },
    callback(true)
  );
}
exports.runPlaybook = runPlaybook;
