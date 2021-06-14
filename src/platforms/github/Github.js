const fs = require("fs");
const path = require("path");
const Listr = require("listr");
const execa = require("execa");
const chalk = require("chalk");
//const clear = require("clear");
//const figlet = require("figlet");
const spawn = require("child_process").spawn;
const { Spinner, ncp, util, access, params, Str } = require(path.join(
  __dirname,
  "../../lib/actions.js"
));
var _ = require("lodash/core");
const inquirer = require("inquirer");
//const { pipeline } = require("stream");
const inquiries = require(path.join(__dirname, "./inquirer.js"));
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));

async function cliRequirements(options) {
  if (options.installInteractive) {
    const answers = await inquirer.prompt(inquiries.inquiries_github);
    options.answers = answers;
    return options;
  }

  if (options.installArguments) {
    return options;
  }
}

exports.cliRequirements = cliRequirements;

function deployRequirements(options, service = "") {
  var count_checks = 0;

  let GithubReqs = [
    {
      title: "Checking for Github CLI",
      task: (ctx, task) =>
        execa("gh", ["--version"])
          .then(result => {
            if (result.stdout.includes("gh version")) {
              count_checks++;
            } else {
              throw new Error(
                "Github CLI not available. Download at https://cli.github.com/"
              );
            }
          })
          .catch(e => {
            console.log(e);
            ctx.aws = false;
            throw new Error(
              "Github CLI not available. Download at https://cli.github.com/"
            );
          })
    }
  ];

  const requirementsGithub = {
    title: "Github Automation",
    task: () => {
      return new Listr(GithubReqs, { concurrent: false });
    }
  };

  return [requirementsGithub, count_checks];
}

exports.deployRequirements = deployRequirements;

async function configInit(options, platform, service = null, callback) {
  const status = new Spinner(
    `Initializing ${platform.toUpperCase()} Activity...`
  );
  status.start();
  status.stop();

  let githubLoginCommand = "gh auth login -w";
  await utilities.cliSpawnCommand(
    options,
    githubLoginCommand,
    "Github Login",
    {
      message: "Github Login Successful",
      catch: true,
      catchStrings: ["already logged", "Logged in as"]
    },
    {
      message: "Github Login Error",
      catch: true,
      catchStrings: ["error"]
    },
    callback
  );
}

exports.configInit = configInit;
