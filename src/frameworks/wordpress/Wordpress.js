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
const spawn = require("child_process").spawn;
const inquirer = require("inquirer");
const inquiries = require(path.join(__dirname, "./inquirer.js"));
var _ = require("lodash/core");
const aws = require(path.join(__dirname, "../../platforms/aws/AWS.js"));
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));

async function cliRequirements(options) {
  if (options.installInteractive) {
    const answers = await inquirer.prompt(inquiries.inquiries_wordpress);
    options.answers = answers;
    return options;
  }
  if (options.installArguments) {
    //lets parse command line arguments
    if (options.appName == "") {
      options.missingArguments["app"] = "Please provide an App Name";
    } else {
      options.answers["app"] = options.appName;
    }

    return options;
  }
}

exports.cliRequirements = cliRequirements;

async function createInit(options, platform, service = "") {
  const status = new Spinner(
    `Creating Wordpress Application on ${platform.toUpperCase()}...`
  );
  await status.start();

  if (platform == "ecs") {
    //await aws.configInit(options, "ecs", service); //configure AWS environment
    //console.log(`%s Configuring ECS`, chalk.green.bold("AWS: "));

    try {
      let deployIP = "";

      let ecsProfile = "modullo";
      let ecsConfig = "modullo-wordpress";
      let ecsCluster = "modullo-wordpress";

      //lets create a Docker compose file for the Wordpress & Database containers
      let dockerComposeYAML = {
        version: "3",
        services: {
          wordpress: {
            image: "wordpress",
            ports: ["80:80"],
            links: ["mysql"],
            logging: {
              driver: "awslogs",
              options: {
                "awslogs-group": ecsConfig,
                "awslogs-region": options.answers["aws-region"],
                "awslogs-stream-prefix": "wordpress"
              }
            }
          },
          mysql: {
            image: "mysql:5.7",
            environment: {
              MYSQL_ROOT_PASSWORD: options.databasePassword
            }
          }
        }
      };

      let dockerComposePath = options.targetDirectory + `/docker-compose.yml`;

      await utilities.writeYAML(
        options,
        dockerComposeYAML,
        dockerComposePath,
        async function(result) {
          if (result) {
            console.log(
              `%s docker-compose.yml successfully written \n`,
              chalk.green.bold("CLI: ")
            );
          } else {
            //
          }
        }
      );

      //lets create a compose file to define ECS tasks
      let ecsComposeYAML = {
        version: 1,
        task_definition: {
          services: {
            wordpress: {
              cpu_shares: 100,
              mem_limit: 262144000
            },
            mysql: {
              cpu_shares: 100,
              mem_limit: 262144000
            }
          }
        }
      };

      let ecsComposePath = options.targetDirectory + `/ecs-params.yml`;

      await utilities.writeYAML(
        options,
        ecsComposeYAML,
        ecsComposePath,
        async function(result) {
          if (result) {
            console.log(
              `%s ecs-params.yml successfully written \n`,
              chalk.green.bold("CLI: ")
            );
          } else {
            //
          }
        }
      );

      let configureECSCommands = `cd ${options.targetDirectory}`;

      configureECSCommands += ` && ecs-cli configure --cluster ${ecsCluster} --default-launch-type EC2 --config-name ${ecsConfig} --region ${options.answers["aws-region"]}`;

      configureECSCommands += ` && ecs-cli configure profile --access-key ${options.answers["aws-access-key"]} --secret-key ${options.answers["aws-secret-key"]} --profile-name ${ecsProfile}`;

      configureECSCommands += ` && ecs-cli up --keypair ${options.answers["keypair"]} --capability-iam --size ${options.answers["aws-instance-size"]} --instance-type ${options.answers["aws-instance-type"]} --cluster-config ${ecsCluster} --ecs-profile ${ecsProfile} --force`;
      //--force to re-create

      configureECSCommands += ` && echo "Waiting 60 secs for created cluster resources to be available before provisioning containers..." && sleep 60s`;
      //--wait 10 secs for resources to be created

      configureECSCommands += ` && ecs-cli compose up --create-log-groups --cluster-config ${ecsConfig} --ecs-profile ${ecsProfile} --force-update`;
      //--force-update to re-push

      configureECSCommands += ` && ecs-cli ps --cluster-config ${ecsCluster}  --ecs-profile ${ecsProfile}`;

      if (options.debugMode) {
        console.log(
          `%s Spawning ` + `${configureECSCommands} ... \n`,
          chalk.yellow.bold("DEBUG: ")
        );
      }

      let ls = await spawn(configureECSCommands, { shell: true });

      ls.stdout.on("data", async data => {
        console.log(`%s ${data}`, chalk.magenta.bold("Output: "));
        if (data.includes("successful")) {
          //next command
        }
        if (data.includes("level=error") || data.includes("level=fatal")) {
          console.log("%s Configure error: " + data, chalk.red.bold("AWS: "));
          await status.stop();
          process.exit(1);
        }

        var r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
        if (data.includes("RUNNING") && data.match(r)) {
          let t = a.match(r);
          console.log(t[0]);
          deployIP = t[0];
        }
      });

      ls.stderr.on("data", async data => {
        console.log(`%s ${data}`, chalk.magenta.bold("Input: "));
        process.stdin.pipe(ls.stdin);
        if (data.includes("quit")) {
          process.exit(1);
        }
      });
      ls.on("close", async code => {
        if (code === 0) {
          console.log("%s Configure successful", chalk.green.bold("AWS: "));
          await status.stop();
        }
      });
      ls.on("error", async error => {
        console.log(`%s ${error.message}`, chalk.green.bold("Error: "));
      });
    } catch (err) {
      console.log("%s Configure error: " + err, chalk.red.bold("Error: "));
      await status.stop();
    }
  }

  //return true;
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
