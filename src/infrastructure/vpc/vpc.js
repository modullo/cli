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
    const answers = await inquirer.prompt(inquiries.inquiries_vpc);
    options.answers = answers;
    return options;
  }
  if (options.installArguments) {
    //lets parse command line arguments
    if (Str(options.vpcName).isEmpty()) {
      options.missingArguments["vpc-name"] =
        "Please specify a Name for your VPC";
    } else {
      options.answers["vpc-name"] = options.vpcName;
    }

    return options;
  }
}

exports.cliRequirements = cliRequirements;

async function createInit(options, service = "") {
  let platform = options.deployPlatform;

  const status = new Spinner(`Creating VPC via ${platform.toUpperCase()}...`);
  status.start();

  if (service == "ansible") {
    // prepare platform data

    let role_name = "aws-vpc";
    if (platform == "aws") {
      role_name = "aws-vpc"; // what? :-) its just a placeholder for future platforms
    }

    // prepare ansible data

    // prepare config
    let roleConfig = {};

    roleConfig["email"] = "";

    // UPDATE CONFIG
    await ansible.updateRole(
      options,
      role_name,
      {},
      {},
      async function (updateRoleData) {
        if (updateRoleData) {
          //deployAWSAccountID:
          // DEFINE VPC VARIABLE YAML
          let vpcVarsYAML = {
            aws_access_key: options.deployAWSAccessKey,
            aws_secret_key: options.deployAWSSecretKey,
            ec2_vpc_net: "",
            region: options.deployAWSRegion,
            vpc_cidr: "10.10.0.0/24",
            vpc_name: "Modullo VPC",
            subnet_name: "Modullo VPC Subnet",
            subnet_cidr: "10.10.0.0/26",
            igw_name: "Modullo VPC IGW",
            securitygroup_name: "Modullo VPC Security Group",
            ec2_tag: "WebServer",
            ec2_key_directory: "/home/ansible/roles/aws-vpc/",
            keypair_name: "ec2_key_pair",
          };

          let vpcVarsPath =
            options.targetDirectory +
            "/ansible/roles/" +
            role_name +
            "/vars/main.yml";

          await utilities.writeYAML(
            options,
            vpcVarsYAML,
            vpcVarsPath,
            async function (result) {
              if (result) {
                console.log(
                  `%s Role Vars Updated \n`,
                  chalk.blueBright.bold("Ansible: ")
                );
              } else {
                //
              }
            }
          );

          // DEFINE VPC TASK YAML
          let vpcTaskYAML = [
            {
              name: "create VPC",
              ec2_vpc_net: {
                name: "{{ vpc_name }}",
                cidr_block: "{{ vpc_cidr }}",
                region: "{{ region }}",
                state: "present",
                aws_access_key: "{{ aws_access_key }}",
                aws_secret_key: "{{ aws_secret_key }}",
              },
              register: "vpc",
            },
            {
              name: "Set VPC ID in variable",
              set_fact: {
                vpc_id: "{{ vpc.vpc.id }}",
              },
            },
            {
              name: "associate subnet to the VPC",
              ec2_vpc_subnet: {
                state: "present",
                vpc_id: "{{ vpc_id }}",
                region: "{{ region }}",
                cidr: "{{ subnet_cidr }}",
                aws_access_key: "{{ aws_access_key }}",
                aws_secret_key: "{{ aws_secret_key }}",
                map_public: "yes",
                resource_tags: {
                  Name: "{{ subnet_name }}",
                },
              },
              register: "subnet",
            },
            {
              name: "create IGW",
              ec2_vpc_igw: {
                vpc_id: "{{ vpc_id }}",
                region: "{{ region }}",
                aws_access_key: "{{ aws_access_key }}",
                aws_secret_key: "{{ aws_secret_key }}",
                state: "present",
                tags: {
                  Name: "{{ igw_name }}",
                },
              },
              register: "igw",
            },
            {
              name: "Route IGW",
              ec2_vpc_route_table: {
                vpc_id: "{{ vpc_id }}",
                region: "{{ region }}",
                aws_access_key: "{{ aws_access_key }}",
                aws_secret_key: "{{ aws_secret_key }}",
                subnets: ["{{ subnet.subnet.id }}"],
                routes: [
                  {
                    dest: "0.0.0.0/0",
                    gateway_id: "{{ igw.gateway_id  }}",
                  },
                ],
                tags: {
                  Name: "{{ route_name }}",
                },
              },
            },
            {
              name: "Create Security Group",
              ec2_group: {
                name: "Modullo SG",
                description: "Modullo VPC Security Groupp",
                vpc_id: "{{ vpc_id }}",
                region: "{{ region }}",
                aws_access_key: "{{ aws_access_key }}",
                aws_secret_key: "{{ aws_secret_key }}",
                rules: [
                  {
                    proto: "tcp",
                    ports: ["80"],
                    cidr_ip: "0.0.0.0/0",
                  },
                  {
                    proto: "tcp",
                    ports: ["22"],
                    cidr_ip: "0.0.0.0/0",
                  },
                ],
                register: "security_group",
              },
            },
          ];

          let vpcTaskPath =
            options.targetDirectory +
            "/ansible/roles/" +
            role_name +
            "/tasks/main.yml";

          await utilities.writeYAML(
            options,
            vpcTaskYAML,
            vpcTaskPath,
            async function (result) {
              if (result) {
                console.log(
                  `%s Role Task Updated \n`,
                  chalk.blueBright.bold("Ansible: ")
                );
              } else {
                //
              }
            }
          );

          // CREATE INVENTORY
          let vpcInventoryFile = `vpc.inventory`;
          let inventoryPath = options.targetDirectory + `/` + vpcInventoryFile;
          let inventoryBody =
            "# vpc.inventory\n" +
            "[vpc]\n" +
            "modullo-vpc\n" +
            "\n" +
            "[modullo_project:children]\n" +
            "vpc\n" +
            "";

          ansible.makeInventory(
            options,
            "infrastructure",
            inventoryBody,
            inventoryPath,
            async function (inventoryResult) {
              if (inventoryResult) {
                console.log(
                  `%s Inventory Successfully Created`,
                  chalk.green.bold("Ansible: ")
                );
                //options.ansibleInventoryPath = inventoryPath

                // CREATE PLAYBOOK
                let vpcPlaybookFile = `vpc.playbook`;
                let vpcPlaybookPath =
                  options.targetDirectory + `/` + vpcPlaybookFile;
                let vpcPlaybookYAML = [
                  {
                    //hosts: "vpc",
                    hosts: "localhost",
                    roles: [
                      options.targetDirectory + "/ansible/roles/" + role_name,
                    ],
                  },
                ];

                await utilities.writeYAML(
                  options,
                  vpcPlaybookYAML,
                  vpcPlaybookPath,
                  async function (result) {
                    if (result) {
                      // EXECUTE PLAYBOOK
                      console.log(
                        `%s Executing Playbook...`,
                        chalk.green.bold("Ansible: ")
                      );
                      //ansible-playbook -i ansibled.inventory vpc.yml
                      ansible.runPlaybook(
                        options,
                        inventoryPath,
                        vpcPlaybookPath,
                        "",
                        async function (playbookResult) {
                          if (playbookResult) {
                            console.log(
                              `%s Playbook Run Successfully`,
                              chalk.green.bold("Ansible: ")
                            );
                          } else {
                            console.log(
                              `%s Error Running Playbook`,
                              chalk.red.bold("Ansible: ")
                            );
                          }
                        }
                      );
                    } else {
                      console.log(
                        `%s Error creating Playbook`,
                        chalk.red.bold("Ansible: ")
                      );
                    }
                  }
                );
              } else {
                console.log(
                  `%s Error creating Inventory`,
                  chalk.red.bold("Ansible: ")
                );
              }
            }
          );
        }
      }
    );
  } else {
    console.log(
      "%s Invalid Service.",
      chalk.green.bold("Modullo INFRASTRUCTURE:")
    );
  }

  return true;
}

exports.createInit = createInit;
