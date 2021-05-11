const fs = require("fs");
const path = require("path");
const { Spinner, ncp, util, access, params, Str } = require(path.join(
  __dirname,
  "../../lib/actions.js"
));
const chalk = require("chalk");
const copy = util.promisify(ncp);
//const axios = require("axios");
//const mysql = require("mysql");
const spawn = require("child_process").spawn;
const inquirer = require("inquirer");
const inquiries = require(path.join(__dirname, "./inquirer.js"));
var _ = require("lodash/core");
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));

async function makePlaybook(options, config) {
  const status = new Spinner(
    `Making an Ansible Playbook for ${config.toUpperCase()}...`
  );
  await status.start();
  await status.stop();

  try {
  } catch (err) {
    console.error("%s Making Playbook: " + err, chalk.red.bold("Ansible"));
    await status.stop();
    process.exit(1);
  }

  return true;
}

exports.makePlaybook = makePlaybook;
