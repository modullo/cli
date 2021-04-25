const fs = require("fs");
const path = require("path");
const { Spinner, ncp, util, access, params, Str } = require(path.join(
  __dirname,
  "../../lib/actions.js"
));
const chalk = require("chalk");
const spawn = require("child_process").spawn;
const inquirer = require("inquirer");
const inquiries = require(path.join(__dirname, "./inquirer.js"));
var _ = require("lodash/core");
const { count } = require("console");
const open = require("open");
const github = require(path.join(
  __dirname,
  "../../platforms/github/Github.js"
));
const utilities = require(path.join(__dirname, "../../lib/utilities.js"));

async function cliRequirements(options) {
  if (options.installInteractive) {
    const answers = await inquirer.prompt(inquiries.inquiries_repository);
    options.answers = answers;
    return options;
  }
  if (options.installArguments) {
    //lets parse command line arguments
    if (options.repositoryName == "") {
      options.missingArguments["repository-name"] =
        "Please provide a Repository Name";
    } else {
      options.answers["repository-name"] = options.repositoryName;
    }
    if (options.repositoryDecription == "") {
      options.missingArguments["repository-description"] =
        "Please provide a Description for your repository";
    } else {
      options.answers["repository-description"] = options.repositoryDecription;
    }
    if (options.repositoryVisibility == "") {
      options.missingArguments["repository-visibility"] =
        "Do you want your repository private or public?";
    } else {
      options.answers["repository-visibility"] = options.repositoryVisibility;
    }

    return options;
  }
}

exports.cliRequirements = cliRequirements;

async function createInit(options, platform, service = "") {
  if (platform == "") {
    platform = options.deployPlatform;
  }
  const status = new Spinner(
    `Creating Repository on ${platform.toUpperCase()}...`
  );
  status.start();
  status.stop();

  if (platform == "github") {
    try {
      console.log(
        `%s Please Login to Github Account. ${chalk.gray.italic(
          "Hit the enter key to log any Inputs"
        )}`,
        chalk.green.bold("Github: ")
      );

      //configure Github environment
      await github.configInit(options, "", "", async function(initResult) {
        //are we creating one or more repositories
        var repos = options.repositoryName.split(",").filter(function(el) {
          return el != null;
        });

        if (options.debugMode) {
          console.log(
            `%s Creating ${repos.length} repositor(ies)`,
            chalk.yellow.bold("DEBUG: ")
          );
        }

        let createRepositoryCommand = "";

        let spawnCompleteString = repos[0];

        for ($i = 0; $i < repos.length; $i++) {
          createRepositoryCommand += $i > 0 ? ` && ` : ``;
          createRepositoryCommand += `gh repo create ${repos[$i]} --confirm --description "${options.repositoryDescription}" --${options.repositoryVisibility}`;
          spawnCompleteString =
            $i > 0 && $i == repos.length - 1 ? repos[$i] : ``;
        }

        await utilities.cliSpawnCommand(
          options,
          createRepositoryCommand,
          "Github",
          {
            message: `Successfully created Github repository`,
            catch: true,
            catchStrings: ["https://github.com/"]
          },
          {
            message: "Error creating Github repository",
            catch: false,
            catchStrings: ["error"]
          },
          async function(repoCreateResult, resultString = "") {
            if (repoCreateResult) {
              console.log(
                `%s Repository Creation Complete: ${resultString.toString()}`,
                chalk.green.bold("Github: ")
              );
              await open(resultString.toString());

              if (resultString.includes(spawnCompleteString)) {
                process.exit(1);
              }
            }
          }
        );

        status.stop();
      });
    } catch (err) {
      console.log(
        "%s Registry Container Creation error: " + err,
        chalk.red.bold("Error: ")
      );
    }
  }

  //return true;
}

exports.createInit = createInit;
