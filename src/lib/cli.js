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
const infrastructureRequirements = require(path.join(
  __dirname,
  "./infrastructureRequirements.js"
));

async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);

  function parseArgumentsIntoOptions(rawArgs) {
    try {
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
          "--infrastructure": String,
          "--premium": Boolean,
          "--app": String,
          "--keypair": String,
          "--aws-account-id": String,
          "--aws-access-key": String,
          "--aws-secret-key": String,
          "--aws-region": String,
          "--firstname": String,
          "--lastname": String,
          "--email": String,
          "--password": String,
          "--domain": String,
          "--dns": String,
          "--dns_resolver": String,
          "--registry-name": String
        },
        { argv: rawArgs.slice(2) }
      );
      return {
        targetDirectory: "",
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
        installFramework: args["--framework"] || "",
        createInfrastructure: args["--infrastructure"] || "",
        deployPlatform: args["--platform"] || "",
        deployPremium: args["--premium"] || false,
        appName: args["--app"] || "",
        deployKeyPair: args["--keypair"] || "none",
        deployAWSAccountID: args["--aws-account-id"] || "",
        deployAWSAccessKey: args["--aws-access-key"] || "",
        deployAWSSecretKey: args["--aws-secret-key"] || "",
        deployAWSRegion: args["--aws-region"] || "",
        deployAWSInstanceType: args["--aws-instance-type"] || "t2.micro",
        deployAWSInstanceSize: args["--aws-instance-size"] || 1,
        argFirstname: args["--firstname"],
        argLastname: args["--lastname"],
        argPassword: args["--password"],
        argFeatures: args["--features"] || "all",
        argDomain: args["--domain"],
        argDNS: args["--dns"] || "localhost",
        argDNSResolver: args["--dns_resolver"] || "valet",
        registryName: args["--registry-name"],
        deployAzureRegion: args["--azure-region"] || "ukwest"
      };
    } catch (err) {
      console.error(
        "%s " +
          err +
          ". You can view all available commands by entering: " +
          chalk.gray.italic.bold("modullo help"),
        chalk.red.bold("Command Failed: ")
      );
      console.log("\n");
      process.exit(1);
    }
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

    // Validate framework, infrastructure and platform choice
    if (
      (!["modullo", "wordpress"].includes(options.installFramework) &&
        !["container-registry", "pipeline"].includes(
          options.createInfrastructure
        )) ||
      !["local", "aws", "azure"].includes(options.deployPlatform)
    ) {
      console.error(
        "%s Please specify a valid framework / infrastructure and platform to proceed!",
        chalk.red.bold("CLI: ")
      );
      console.log(
        `You can run something like ${chalk.gray.italic.bold(
          "modullo create --framework wordpress --platform local"
        )} to setup Modullo on your local system OR ${chalk.gray.italic.bold(
          "modullo create --infrastructure vm --platform aws"
        )} to spin-up a Virtual Machine on your AWS environment\n`
      );
      process.exit(1);
    }

    switch (options.defaultAction) {
      case "create":
        options.targetDirectory =
          process.cwd() +
          `/${params.general.create_output_folder}-${options.installFramework}-${options.deployPlatform}`;

        options.template =
          options.installFramework == "modullo" ? "modullo" : "create";

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
        if (options.deployPlatform != "") {
          options = await platformRequirements.checkRequirements(options);
        }

        //console.log(options)

        // require infrastructure requirements
        if (options.createInfrastructure != "") {
          options = await infrastructureRequirements.checkRequirements(options);
        }

        //console.log(options)

        // require framework requirements
        if (options.installFramework != "") {
          options = await frameworkRequirements.checkRequirements(options);
        }

        //console.log(options)

        break;

      case "pipeline":
        options.targetDirectory =
          process.cwd() +
          `/${params.general.pipeline_output_folder}-${options.installFramework}-${options.deployPlatform}`;

        options.template = "pipeline";

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

    //console.log(options)

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
  await actions.initModulloCLI(options);
}

exports.cli = cli;

// ...
