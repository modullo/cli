const fs = require("fs");
const Listr = require("listr");
const ncp = require("ncp");
exports.ncp = ncp;
const path = require("path");
const envfile = require("envfile");
const util = require("util");
exports.util = util;
const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const spawn = require("child_process").spawn;
const CLI = require("clui");
const Spinner = CLI.Spinner;
exports.Spinner = Spinner;
const access = util.promisify(fs.access);
exports.access = access;
const params = require(path.join(__dirname, "./params.js"));
exports.params = params;
const Str = require("@supercharge/strings");
exports.Str = Str;
var _ = require("lodash/core");
const { installModullo } = require("./installModullo");
// const deployRequirements = require(path.join(
//   __dirname,
//   "./deployRequirements.js"
// ));
const aws = require(path.join(__dirname, "../platforms/aws/AWS.js"));
const wordpress = require(path.join(
  __dirname,
  "../frameworks/wordpress/Wordpress.js"
));

clear();
console.log(
  chalk.blue(
    figlet.textSync(params.general.title, { horizontalLayout: "full" })
  )
);

console.log(
  `Welcome to the ${params.general.title_full} v` +
    require(path.join(__dirname, "../../package.json")).version
);
console.log(
  `You can exit the ${params.general.title} CLI at any time by hitting CTRL + C`
);

function installerHelp() {
  console.log(chalk.blue(`Below are the key commands you can run:`));
  console.log(
    chalk.green.bold("install") + ` Run the ${params.general.title} Installer`
  );
  console.log(
    chalk.green.bold("load") +
      ` Add a ${params.general.title} Module like so: ` +
      chalk.white.italic.bold("modullo load modules-auth")
  );
}

async function initModullo(options) {
  // console.log("init")
  // console.log(options)
  switch (options.defaultAction) {
    case "create":
      // const fullPathName = __dirname + "/main.js";
      // const templateDir = path.resolve(
      //   fullPathName.substr(fullPathName.indexOf("/")),
      //   "../../templates",
      //   options.template.toLowerCase()
      // );
      // options.templateDirectory = templateDir;

      // options = {
      //   ...options,
      //   targetDirectory:
      //     process.cwd() +
      //     `/` +
      //     params.general.deploy_output_folder +
      //     `-deploy-` +
      //     (options.deployPlatform || "none")
      // };

      if (options.deployPlatform == "aws") {
        await aws.configInit(options, "ecs"); //configure AWS environment
      }
      if (options.installFramework == "wordpress") {
        options = await wordpress.cliRequirements(options); // require specific Wordpress CLI requirements
        wordpress.createInit(options);
      }

      break;
    case "install":
      installModullo.installModullo(options);
      break;
    case "load":
      if (options.module == "no-module") {
        console.log("%s No Module Specified", chalk.blue.bold("Modullo LOAD:"));
      } else {
        //installModulloModule.installModulloModule(options);
      }
      break;
    case "help":
      cmdHelp();
      break;
    default:
      installerHelp();
  }
}

exports.processCLI = initModullo;
