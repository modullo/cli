const arg = require("arg");
const inquirer = require("inquirer");
const path = require("path");
const params = require(path.join(__dirname, "./params.js"));
const actions = require(path.join(__dirname, "./actions.js"));
const inquiries = require(path.join(__dirname, "./inquirer.js"));
const Listr = require("listr");
const CLI = require("clui");
const Spinner = CLI.Spinner;
const execa = require("execa");
const chalk = require("chalk");
const spawn = require("child_process").spawn;
const Str = require("@supercharge/strings");
var _ = require("lodash/core");
const installRequirements = require(path.join(
  __dirname,
  "./installRequirements.js"
));
const platformRequirements = require(path.join(
  __dirname,
  "./platformRequirements.js"
));
const frameworkRequirements = require(path.join(
  __dirname,
  "./frameworkRequirements.js"
));
//const wordpress = require(path.join( __dirname, "../frameworks/wordpress/Wordpress.js" ));
//const aws = require(path.join(__dirname, "../platforms/aws/AWS.js"));

async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);

  function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
      {
        "--action": String,
        "--auto": Boolean,
        "--command_path": String,
        "--env_path": String,
        "--debug": Boolean,
        "--arguments": Boolean,
        "--interactive": Boolean,
        "--template": String,
        "--email": String,
        "--agreement": String,
        "--platform": String,
        "--framework": String,
        "--premium": Boolean,
        "--app": String,
        "--keypair": String,
        "--aws-access-key": String,
        "--aws-secret-key": String,
        "--aws-region": String
      },
      { argv: rawArgs.slice(2) }
    );
    return {
      missingArguments: {},
      answers: [],
      defaultAction: rawArgs[2] || "help",
      skipInputs: args["--auto"] || false,
      commandPath: args["--command_path"],
      envPath: args["--env_path"],
      installInteractive: args["--interactive"] || false,
      installArguments: args["--arguments"] || true,
      defaultAction: rawArgs[2] || "help",
      debugMode: args["--debug"] || false,
      databasePassword: Str.random(18),
      argTemplate: args["--template"] || "production",
      argEmail: args["--email"],
      argAgreeementTOS: args["--agreement"],
      installFramework: args["--framework"] || "modullo",
      deployPlatform: args["--platform"] || "local",
      deployPremium: args["--premium"] || false,
      appName: args["--app"] || "",
      deployKeyPair: args["--keypair"] || "none",
      deployAWSAccessKey: args["--aws-access-key"] || "",
      deployAWSSecretKey: args["--aws-secret-key"] || "",
      deployAWSRegion: args["--aws-region"] || "",
      deployAWSInstanceType: args["--aws-instance-type"] || "t2.micro",
      deployAWSInstanceSize: args["--aws-instance-size"] || 1
    };
  }

  async function promptForMissingOptions(options) {
    const defaultTemplate = "production";
    // if (options.skipInputs) {
    //   return {
    //     ...options,
    //     template: options.template || defaultTemplate
    //   };
    // }

    //let optionsArguments = [];
    //options.missingArguments = {};

    if (
      !options.argEmail ||
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
        options.argEmail
      )
    ) {
      options.missingArguments["email"] = "Please enter a valid login Email";
    } else {
      options.answers["email"] = options.argEmail;
    }
    if (
      !options.argAgreeementTOS ||
      !["yes", "no"].includes(options.argAgreeementTOS)
    ) {
      options.missingArguments["agreement"] =
        "You need to agree (or disagree) with Terms/Conditions of Use and Privacy Policy available at https://modullo.io/agreement. Enter 'yes' or 'no'";
    } else {
      options.answers["agreement"] = options.argAgreeementTOS;
    }

    //let answers = optionsArguments;

    switch (options.defaultAction) {
      case "install":
        if (
          options.installPlatform ||
          !["wordpress"].includes(options.installPlatform)
        ) {
          console.error(
            "%s Please specify a valid framework or platform to install!",
            chalk.red.bold("CLI: ")
          );
          console.log(
            `You can run something like ${chalk.gray.italic.bold(
              "modullo install --platform wordpress"
            )} OR ${chalk.gray.italic.bold(
              "dorcas install --community"
            )} to setup the Modullo framework\n`
          );
          process.exit(1);
        }

        if (options.installPlatform) {
          await installRequirements.installRequirements();

          if (options.installInteractive) {
            const answers = await inquirer.prompt(inquiries.business_inquiries);
            return {
              ...options,
              answers,
              template: answers.template || defaultTemplate
            };
          }
          if (options.installArguments) {
            //lets parse command line arguments
            let optionsArguments = [];
            //let missingArguments = {};

            if (
              !options.argTemplate ||
              !["production", "development"].includes(options.argTemplate)
            ) {
              options.missingArguments["template"] =
                "Template must be either 'production' or 'development'";
            } else {
              optionsArguments["template"] = options.argTemplate;
            }
            if (
              !options.argEmail ||
              !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
                options.argEmail
              )
            ) {
              options.missingArguments["email"] =
                "Please enter a valid login Email";
            } else {
              optionsArguments["email"] = options.argEmail;
            }
            if (
              !options.argAgreeementTOS ||
              !["yes", "no"].includes(options.argAgreeementTOS)
            ) {
              options.missingArguments["agreement"] =
                "You need to agree (or disagree) with Terms/Conditions of Use and Privacy Policy available at https://dorcas.io/agreement. Enter 'yes' or 'no'";
            } else {
              optionsArguments["agreement"] = options.argAgreeementTOS;
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
              answers,
              template: optionsArguments.template || defaultTemplate
            };
          }
        }

        const install_answers = await inquirer.prompt(
          inquiries.inquiries_install
        );
        return {
          ...options,
          install_answers,
          template: install_answers.template || defaultTemplate
        };
        break;

      case "create":
        if (
          !["modullo", "wordpress"].includes(options.installFramework) ||
          !["local", "aws"].includes(options.deployPlatform)
        ) {
          console.error(
            "%s Please specify a valid framework and platform to proceed!",
            chalk.red.bold("CLI: ")
          );
          console.log(
            `You can run something like ${chalk.gray.italic.bold(
              "modullo create --framework modullo --platform local"
            )} to setup Modullo on your local system OR ${chalk.gray.italic.bold(
              "modullo create --framework wordpress --platform aws"
            )} to setup the Wordpress on your AWS environment\n`
          );
          process.exit(1);
        }

        console.log(
          `\n` +
            `Setting up ${chalk.gray.bold(
              options.installFramework.toUpperCase()
            )} on ${chalk.gray.italic.bold(
              options.deployPlatform.toUpperCase()
            )} ...`
        );

        await installRequirements.installRequirements(); // require standard Modullo CLI requirements

        // require platform requirements
        options = await platformRequirements.checkRequirements(options);

        // require framework requirements
        options = await frameworkRequirements.checkRequirements(options);

        break;

      case "pipeline":
        if (
          !["modullo", "wordpress"].includes(options.installFramework) ||
          !["aws"].includes(options.deployPlatform)
        ) {
          console.error(
            "%s Please specify a valid framework and platform to proceed!",
            chalk.red.bold("CLI: ")
          );
          console.log(
            `You can run something like ${chalk.gray.italic.bold(
              "modullo pipeline --framework modullo --platform aws"
            )} to setup a Pipeline for Wordpress on your AWS environment\n`
          );
          process.exit(1);
        }

        console.log(
          `\n` +
            `Setting up a Pipeline for ${chalk.gray.bold(
              options.installFramework.toUpperCase()
            )} on ${chalk.gray.italic.bold(
              options.deployPlatform.toUpperCase()
            )} ...`
        );

        await installRequirements.installRequirements(); // require standard Modullo CLI requirements

        // require platform requirements
        options = await platformRequirements.checkRequirements(
          options,
          "pipeline"
        );

        // require framework requirements
        options = await frameworkRequirements.checkRequirements(
          options,
          "pipeline"
        );

        break;

      case "load":
        return {
          ...options,
          module: args["load"] || "no-module"
        };
        break;

      default:
        return {
          ...options,
          template: options.template || defaultTemplate
        };
    }

    if (_.size(options.missingArguments) > 0) {
      console.error(
        "%s The following argument(s) is/are required but either missing OR in the wrong format: ",
        chalk.red.bold("Error")
      );
      Object.keys(options.missingArguments).forEach(element => {
        console.log(
          `- ${chalk.red.bold(element)}: ${chalk.italic(
            options.missingArguments[element]
          )}`
        );
      });
      console.log("\n");
      process.exit(1);
    }

    return options;

    // return {
    //   ...options,
    //   answers
    // };
  }

  //process the CLI arguments & options into Modullo Actions
  await actions.processCLI(options);
}

exports.cli = cli;

// ...
