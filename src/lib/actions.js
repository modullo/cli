const fs = require("fs");
const Listr = require("listr");
const ncp = require("ncp");
exports.ncp = ncp;
const path = require("path");
const envfile = require("envfile");
const util = require("util");
exports.util = util;
const chalk = require("chalk");
// const clear = require("clear");
// const figlet = require("figlet");
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
//const utilities = require(path.join(__dirname, "./utilities.js"));
const { installModullo } = require("./installModullo");
const aws = require(path.join(__dirname, "../platforms/aws/AWS.js"));
const wordpress = require(path.join(
  __dirname,
  "../frameworks/wordpress/Wordpress.js"
));
const modullo = require(path.join(
  __dirname,
  "../frameworks/modullo/Modullo.js"
));
const software = require(path.join(
  __dirname,
  "../frameworks/software/Software.js"
));
const laravel = require(path.join(
  __dirname,
  "../frameworks/laravel/Laravel.js"
));
const containerRegistry = require(path.join(
  __dirname,
  "../infrastructure/container-registry/containerRegistry.js"
));
const repository = require(path.join(
  __dirname,
  "../infrastructure/repository/repository.js"
));
const pipeline = require(path.join(
  __dirname,
  "../infrastructure/pipeline/pipeline.js"
));

async function initModulloCLI(options) {
  //options.port_increment = options.template.toLowerCase() == "production" ? 0 : 1000; //separate production & development ports

  //options.container_name_addon = options.template.toLowerCase() == "production" ? "" : "_development"; //separate production & development ports

  switch (options.defaultAction) {
    case "config":
      //do nothing
      break;

    case "install":
      installModullo.installModullo(options);
      break;

    case "create":
      switch (options.installFramework) {
        case "modullo":
          modullo.createInit(options, "");
          break;

        case "wordpress":
          wordpress.createInit(options, options.deployPlatform);
          break;

        case "laravel":
          laravel.createInit(options, "serverless");
          break;
      }

      switch (options.createInfrastructure) {
        case "container-registry":
          containerRegistry.createInit(options, "");
          break;
        case "repository":
          repository.createInit(options, "");
          break;
        case "pipeline":
          pipeline.createInit(options, "cdk");
          break;
      }

      break;

    case "provision":
      switch (options.installFramework) {
        case "software":
          software.createInit(
            options,
            options.deployPlatform,
            options.createInfrastructure
          );
          break;
      }

      break;

    case "load":
      if (options.module == "no-module") {
        console.log("%s No Module Specified", chalk.blue.bold("Modullo LOAD:"));
      } else {
        //installModulloModule.installModulloModule(options);
      }
      break;
    case "help":
      installerHelp();
      break;
    default:
      installerHelp();
  }
}

exports.initModulloCLI = initModulloCLI;

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
