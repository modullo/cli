const arg = require("arg");
const path = require("path");
const params = require(path.join(__dirname, "./params.js"));
const Listr = require("listr");
const CLI = require("clui");
const Spinner = CLI.Spinner;
const execa = require("execa");
const chalk = require("chalk");

async function install(options, software_slug, software_name) {
  const status = new Spinner(`Installing ${software_name}...`);
  status.start();
  console.log("\n");

  //platform checks
  let current_platform = options.modulloOS;

  if (params.installer.available_os.includes(current_platform)) {
    let available_software =
      params.installer.available_software[current_platform];
  } else {
    console.log("\n");
    console.log(`%s Unsupported OS Platform`, chalk.red.bold("CLI"));
    console.log("\n");
  }
}

exports.install = install;
