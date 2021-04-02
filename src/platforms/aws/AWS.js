const fs = require("fs");
const path = require("path");
const Listr = require("listr");
const execa = require("execa");
const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const spawn = require("child_process").spawn;
const { Spinner, ncp, util, access, params, Str } = require(path.join(
  __dirname,
  "../../lib/actions.js"
));
var _ = require("lodash/core");
const inquirer = require("inquirer");
const inquiries = require(path.join(__dirname, "./inquirer.js"));

async function cliRequirements(options) {
  if (options.installInteractive) {
    const answers = await inquirer.prompt(inquiries.inquiries_aws);
    return {
      ...options,
      answers
    };
  }
  if (options.installArguments) {
    //lets parse command line arguments
    let optionsArguments = [];
    let missingArguments = {};

    if (
      !options.argEmail ||
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
        options.argEmail
      )
    ) {
      missingArguments["email"] = "Please enter a valid login Email";
    } else {
      optionsArguments["email"] = options.argEmail;
    }
    if (
      !options.argAgreeementTOS ||
      !["yes", "no"].includes(options.argAgreeementTOS)
    ) {
      missingArguments["agreement"] =
        "You need to agree (or disagree) with Terms/Conditions of Use and Privacy Policy available at https://modullo.io/agreement. Enter 'yes' or 'no'";
    } else {
      optionsArguments["agreement"] = options.argAgreeementTOS;
    }

    if (options.deployAWSAccessKey == "") {
      missingArguments["aws-access-key"] = "Please enter your AWS Access Key";
    } else {
      optionsArguments["aws-access-key"] = options.deployAWSAccessKey;
    }

    if (options.deployAWSSecretKey == "") {
      missingArguments["aws-secret-key"] = "Please enter your AWS Secret Key";
    } else {
      optionsArguments["aws-secret-key"] = options.deployAWSSecretKey;
    }

    //console.log(missingArguments);
    //console.log(optionsArguments);

    if (_.size(missingArguments) > 0) {
      console.error(
        "%s The following argument(s) is/are required but either missing OR in the wrong format: ",
        chalk.red.bold("Error")
      );
      Object.keys(missingArguments).forEach(element => {
        console.log(
          `- ${chalk.red.bold(element)}: ${chalk.italic(
            missingArguments[element]
          )}`
        );
      });
      console.log("\n");
      process.exit(1);
    }

    let answers = optionsArguments;

    return {
      ...options,
      answers
    };
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
  console.log("aws");
  console.log(options);
  const status = new Spinner(
    `Initializing AWS ${platform.toUpperCase()} Deployment...`
  );
  status.start();

  if (platform == "ecs") {
    console.log(`%s Configuring ECS`, chalk.green.bold("AWS: "));

    status.stop();

    try {
      //ecs-cli configure profile --profile-name wordpress --access-key $AWS_ACCESS_KEY_ID --secret-key $AWS_SECRET_ACCESS_KEY
      let configureECSCommands = `ecs-cli configure`;
      configureECSCommands += ` profile --profile-name modullo-wordpress`;
      configureECSCommands += ` --access-key ${options.answers["aws-access-key"]} --secret-key ${options.answers["aws-secret-key"]}`;

      if (options.debugMode) {
        console.log(
          `%s Spawning ` + `${configureECSCommands} ... \n`,
          chalk.yellow.bold("DEBUG: ")
        );
      }

      let ls = await spawn(configureECSCommands, { shell: true });

      ls.stdout.on("data", async data => {
        console.log(`%s ${data}`, chalk.magenta.bold("Output: "));

        if (data.includes("Logged in as")) {
          await createDorcasApp(options);
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
        }
      });
      ls.on("error", async error => {
        console.log(`%s ${error.message}`, chalk.green.bold("Error: "));
      });
    } catch (err) {
      console.log("%s Configure error: " + err, chalk.red.bold("AWS: "));
      //await status.stop();
    }
  }
}

exports.configInit = configInit;
