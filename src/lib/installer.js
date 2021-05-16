const arg = require("arg");
const path = require("path");
const params = require(path.join(__dirname, "./params.js"));
const Listr = require("listr");
const CLI = require("clui");
const Spinner = CLI.Spinner;
const execa = require("execa");
const chalk = require("chalk");
const utilities = require(path.join(__dirname, "./utilities.js"));

async function install(options, software_slug, software_name) {
  const status = new Spinner(`Installing ${software_name}...`);
  status.start();
  console.log("\n");

  //platform checks
  let current_platform = options.modulloOS;

  let available_software =
    params.installer.data[current_platform].available_software;

  if (available_software.includes(software_slug)) {
    //proceed with installation
    let installer_prefix =
      params.installer.data[current_platform].installer_prefix;

    let installCommand = `${installer_prefix} ${software_slug}`;
    await utilities.cliSpawnCommand(
      options,
      installCommand,
      "Modullo Installer",
      {
        message: "Installation Successful",
        catch: true,
        catchStrings: ["successful"]
      },
      {
        message: "Installation Error",
        catch: false,
        catchStrings: ["error"]
      },
      callback
    );
  } else {
    console.log("\n");
    console.log(
      `%s Unsupported Software: ${software_slug} (${software_name})`,
      chalk.red.bold("CLI")
    );
    console.log("\n");
  }
}

exports.install = install;
