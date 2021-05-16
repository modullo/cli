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
      let baseArgs = {
        "--action": String,
        "--auto": Boolean,
        "--command_path": String,
        "--env_path": String,
        "--debug": Boolean,
        "--arguments": Boolean,
        "--interactive": Boolean,
        "--create-project": Boolean,
        "--template": String,
        "--email": String,
        "--agreement": String,
        "--platform": String,
        "--framework": String,
        "--infrastructure": String,
        "--premium": Boolean,
        "--app": String,
        "--keypair": String,
        "--firstname": String,
        "--lastname": String,
        "--email": String,
        "--password": String,
        "--domain": String,
        "--dns": String,
        "--dns_resolver": String,
        "--azure-region": String,
        "--registry-name": String,
        "--repository-name": String
      };

      //add additional baseArgs from infrastructure, platform or framework requirements
      let finalArgs = {
        ...baseArgs,
        ...frameworkRequirements.getArgs(),
        ...platformRequirements.getArgs(),
        ...infrastructureRequirements.getArgs()
      };

      //console.log(finalArgs)

      const args = arg(finalArgs, { argv: rawArgs.slice(2) });

      //console.log(args)

      let baseOptions = {
        modulloOS: "",
        modulloOSFull: "",
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
        modulloAppID: Str.random(5),
        createProject: args["--create-project"] || false,
        argTemplate: args["--template"] || "production",
        argEmail: args["--email"],
        argAgreeementTOS: args["--agreement"],
        installFramework: args["--framework"] || "",
        createInfrastructure: args["--infrastructure"] || "",
        deployPlatform: args["--platform"] || "",
        deployPremium: args["--premium"] || false,
        appName: args["--app"] || "",
        deployKeyPair: args["--keypair"] || "none",
        deployAWSInstanceType: args["--aws-instance-type"] || "t2.micro",
        deployAWSInstanceSize: args["--aws-instance-size"] || 1,
        argFirstname: args["--firstname"],
        argLastname: args["--lastname"],
        argPassword: args["--password"],
        argFeatures: args["--features"] || "all",
        argDomain: args["--domain"],
        argDNS: args["--dns"] || "localhost",
        argDNSResolver: args["--dns_resolver"] || "valet",
        registryName: args["--registry-name"] || "",
        deployAzureRegion: args["--azure-region"] || "ukwest",
        repositoryName: args["--repository-name"] || ""
      };

      //console.log(baseOptions)

      //add additional baseOptions from infrastructure, platform or framework requirements
      return {
        ...baseOptions,
        ...frameworkRequirements.getOptions(args),
        ...platformRequirements.getOptions(args),
        ...infrastructureRequirements.getOptions(args)
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

    //determine OS
    options.modulloOS = process.platform;

    switch (options.modulloOS) {
      case "win32":
        options.modulloOSFull = "Windows OS";
        break;
      case "darwin":
        options.modulloOSFull = "Mac OS";
        break;
    }

    if (!params.installer.available_os.includes(options.modulloOS)) {
      console.log("\n");
      console.log(`%s Unsupported OS Platform`, chalk.red.bold("CLI"));
      console.log("\n");
    }

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
      (!params.frameworks.list.includes(options.installFramework) &&
        !params.infrastructure.list.includes(options.createInfrastructure)) ||
      !params.platforms.list.includes(options.deployPlatform)
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

    let framework_infrastructure;

    framework_infrastructure =
      options.installFramework == ""
        ? options.createInfrastructure
        : options.installFramework;

    options.targetDirectory =
      process.cwd() +
      `/${params.general.create_output_folder}-${framework_infrastructure}-${options.deployPlatform}`;

    options.template =
      options.installFramework == "modullo" ? "modullo" : "create";

    switch (options.defaultAction) {
      case "create":
        console.log(
          `\n` +
            `Setting up ${chalk.gray.bold(
              framework_infrastructure.toUpperCase()
            )} on ${chalk.gray.italic.bold(
              options.deployPlatform.toUpperCase()
            )} ...`
        );

        await installRequirements.installRequirements(options); // require standard Modullo CLI requirements

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

      case "provision":
        options.template = "provision";
        console.log(
          `\n` +
            `Provisioning a/an ${chalk.gray.italic.bold(
              options.deployPlatform.toUpperCase()
            )} ${chalk.gray.italic.bold(
              options.createInfrastructure
            )} machine with ${chalk.gray.bold(options.installFramework)} ...`
        );

        await installRequirements.installRequirements(); // require standard Modullo CLI requirements

        // require platform requirements
        if (options.deployPlatform != "") {
          options = await platformRequirements.checkRequirements(options);
        }

        // require infrastructure requirements
        if (options.createInfrastructure != "") {
          options = await infrastructureRequirements.checkRequirements(options);
        }

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
