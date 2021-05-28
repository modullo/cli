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
const clear = require("clear");
const figlet = require("figlet");
const chalk = require("chalk");
const spawn = require("child_process").spawn;
const Str = require("@supercharge/strings");
var _ = require("lodash/core");
const utilities = require(path.join(__dirname, "./utilities.js"));

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

clear();
console.log(
  chalk.blueBright(
    figlet.textSync(params.general.title, { horizontalLayout: "full" })
  )
);

let platOS = process.platform;
let platOSFull = `Unsupported Platform`;
switch (platOS) {
  case "win32":
    platOSFull = "Windows OS";
    break;
  case "darwin":
    platOSFull = "Mac OS";
    break;
}
console.log(
  `Welcome to the ${params.general.title_full} v` +
    require(path.join(__dirname, "../../package.json")).version +
    ` running on ${platOSFull}`
);
console.log(
  `You can exit the ${params.general.title} CLI at any time by hitting CTRL + C \n`
);

async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await assertGlobalConfig(options, "check");
  options = await assertModulloConfig(options);
  options = await promptForMissingOptions(options);

  function parseArgumentsIntoOptions(rawArgs) {
    try {
      let baseArgs = {
        "--action": String,
        "--auto": Boolean,
        "--command_path": String,
        "--env_path": String,
        "--dev": Boolean,
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
        "--multi-app": Boolean,
        "--multi-container": Boolean,
        "--app": String,
        "--keypair": String,
        "--email": String,
        "--domain": String,
        "--dns": String,
        "--dns_resolver": String,
        "--azure-region": String
      };

      //add additional baseArgs from infrastructure, platform or framework requirements
      let finalArgs = {
        ...baseArgs,
        ...frameworkRequirements.getArgs(),
        ...platformRequirements.getArgs(),
        ...infrastructureRequirements.getArgs()
      };

      const args = arg(finalArgs, { argv: rawArgs.slice(2) });

      let baseOptions = {
        packageDirectory: "",
        modulloOS: "",
        modulloOSFull: "",
        targetDirectory: "",
        missingArguments: {},
        answers: [],
        defaultAction: rawArgs[2] || "help",
        skipInputs: args["--auto"] || false,
        commandPath: args["--command_path"],
        envPath: args["--env_path"],
        devMode: args["--dev"] || false,
        debugMode: args["--debug"] || false,
        installInteractive: args["--interactive"] || false,
        installArguments: args["--arguments"] || true,
        defaultAction: rawArgs[2] || "help",
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
        multiApp: args["--multi-app"] || false,
        multiContainer: args["--multi-container"] || false,
        appName: args["--app"] || "",
        deployKeyPair: args["--keypair"] || "none",
        deployAWSInstanceType: args["--aws-instance-type"] || "t2.micro",
        deployAWSInstanceSize: args["--aws-instance-size"] || 1,
        argFeatures: args["--features"] || "all",
        argDomain: args["--domain"],
        argDNS: args["--dns"] || "localhost",
        argDNSResolver: args["--dns_resolver"] || "valet",
        deployAzureRegion: args["--azure-region"] || "ukwest"
      };

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

  async function assertGlobalConfig(options, action_type) {
    let homeDir = await utilities.homeDirectory();
    let globalConfigPath = path.join(homeDir, `.modullo`);

    let globalConfigExists = await utilities.file_exists(globalConfigPath);

    switch (action_type) {
      case "check":
        //check if file exists
        if (globalConfigExists) {
          console.log(
            `%s Modullo GLOBAL Configuration FOUND. Reading...`,
            chalk.blueBright.bold("CLI:")
          );

          //loadup
          let configs = await utilities.readFile(
            options,
            "yaml",
            globalConfigPath,
            async function(readResult, readFile) {
              if (readResult) {
                console.log(
                  `%s Modullo GLOBAL Configuration READ.`,
                  chalk.blueBright.bold("CLI:")
                );

                let globalConfig = readFile;

                // lets process assignments (prefer CLI argument first)
                options.argEmail = Str(options.argEmail).isNotEmpty()
                  ? options.argEmail
                  : globalConfig.email;
                options.argFirstname = Str(options.argFirstname).isNotEmpty()
                  ? options.argFirstname
                  : globalConfig.bio.firstname;
                options.argLastname = Str(options.argLastname).isNotEmpty()
                  ? options.argLastname
                  : globalConfig.bio.lastname;
              }
            }
          );
        }

        break;

      case "create":
        if (!globalConfigExists) {
          console.log(
            `%s GLOBAL Configuration NOT FOUND. Writing...`,
            chalk.blueBright.bold("CLI:")
          );

          //define config structure
          let globalConfigYAML = {
            modullo_id: 1,
            email: Str(options.argEmail).isNotEmpty()
              ? options.argEmail
              : "dev@modullo.io",
            bio: {
              firstname: Str(options.argFirstname).isNotEmpty()
                ? options.argFirstname
                : "",
              lastname: Str(options.argLastname).isNotEmpty()
                ? options.argLastname
                : ""
            }
          };

          await utilities.writeYAML(
            options,
            globalConfigYAML,
            globalConfigPath,
            async function(result) {
              if (result) {
                console.log(
                  `%s Modullo Global configuration successfully written \n`,
                  chalk.blueBright.bold("CLI: ")
                );
              } else {
                //
              }
            }
          );
        }

        break;
    }

    return options;
  }

  async function assertModulloConfig(options) {
    let modulloConfigPath = path.join(process.cwd(), `modullo.yaml`);

    let modulloConfifExists = await utilities.file_exists(modulloConfigPath);

    //check if file exists

    if (modulloConfifExists) {
      console.log(
        `%s Modullo APP Configuration FOUND. Reading...`,
        chalk.blueBright.bold("CLI:")
      );

      //loadup
      let configs = await utilities.readFile(
        options,
        "yaml",
        modulloConfigPath,
        async function(readResult, readFile) {
          if (readResult) {
            console.log(
              `%s Modullo APP Configuration READ.`,
              chalk.blueBright.bold("CLI:")
            );

            let modulloConfig = readFile;

            // lets process BASE assignments (use config if not  exist in options already)
            options.installFramework = Str(
              options.installFramework
            ).isNotEmpty()
              ? options.installFramework
              : modulloConfig.base.framework;

            options.createInfrastructure = Str(
              options.createInfrastructure
            ).isNotEmpty()
              ? options.createInfrastructure
              : modulloConfig.base.infrastructure;

            options.deployPlatform = Str(options.deployPlatform).isNotEmpty()
              ? options.deployPlatform
              : modulloConfig.base.platform;

            options.multiApp = Str(options.multiApp).isNotEmpty()
              ? options.multiApp
              : modulloConfig["multi-app"];
            options.multiContainer = Str(options.multiContainer).isNotEmpty()
              ? options.multiContainer
              : modulloConfig["multi-containner"];
          }
        }
      );

      //or leave?
    } else {
      console.log(
        `%s Modullo Configuration NOT FOUND. Writing...`,
        chalk.blueBright.bold("CLI:")
      );

      //define config structure
      let modulloConfigYAML = {
        version: 1,
        base: {
          framework: options.installFramework || "modullo",
          platform: options.deployPlatform || "local",
          infrastructure: options.createInfrastructure || "vm"
        },
        parameters: {
          framework: {
            app: "ModulloApp"
          }
        },
        "multi-app": false,
        "multi-container": false
      };

      await utilities.writeYAML(
        options,
        modulloConfigYAML,
        modulloConfigPath,
        async function(result) {
          if (result) {
            console.log(
              `%s Modullo Configuration successfully written \n`,
              chalk.blueBright.bold("CLI: ")
            );
          } else {
            //
          }
        }
      );
    }

    //write file if necessary

    return options;
  }

  async function promptForMissingOptions(options) {
    const defaultTemplate = "production";

    //determine OS
    options.modulloOS = platOS;
    options.modulloOSFull = platOSFull;

    if (!params.installer.available_os.includes(options.modulloOS)) {
      console.log("\n");
      console.log(`%s Unsupported OS Platform`, chalk.red.bold("CLI"));
      console.log("\n");
    }

    //get package directory
    options.packageDirectory = await utilities.packageRootFolder(options);

    // check for  standard cli requirements
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

    // Validate framework, infrastructure and platform choice (if not in config mode)
    if (options.defaultAction !== "config") {
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
    }

    let framework_infrastructure;

    framework_infrastructure =
      options.installFramework == ""
        ? options.createInfrastructure
        : options.installFramework;

    let project_folder_name = `${params.general.create_output_folder}-${framework_infrastructure}-${options.deployPlatform}`;

    //options.targetDirectory = process.cwd() + `/${params.general.create_output_folder}-${framework_infrastructure}-${options.deployPlatform}`;

    options.targetDirectory = path.join(
      process.cwd(),
      `${project_folder_name}`
    );

    options.template =
      options.installFramework == "modullo" ? "modullo" : "create";

    switch (options.defaultAction) {
      case "config":
        await assertGlobalConfig(options, "create");

        break;

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
