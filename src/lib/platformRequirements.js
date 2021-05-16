const arg = require("arg");
const path = require("path");
//const params = require(path.join(__dirname, "./params.js"));
const Listr = require("listr");
const CLI = require("clui");
const Spinner = CLI.Spinner;
const execa = require("execa");
const chalk = require("chalk");
//const Str = require("@supercharge/strings");
var _ = require("lodash/core");

const aws = require(path.join(__dirname, "../platforms/aws/AWS.js"));

const azure = require(path.join(__dirname, "../platforms/azure/Azure.js"));

const local = require(path.join(__dirname, "../platforms/local/Local.js"));

const github = require(path.join(__dirname, "../platforms/github/Github.js"));

const linux = require(path.join(__dirname, "../platforms/linux/Linux.js"));

function getArgs() {
  return {
    "--machine-host": String,
    "--machine-username": String,
    "--machine-key-path": String,
    "--project-path": String
  };
}
exports.getArgs = getArgs;

function getOptions(args) {
  return {
    machineHost: args["--machine-host"] || "",
    machineUsername: args["--machine-username"] || "ubuntu",
    machineKeyPath: args["--machine-key-path"] || "",
    ansibleInventoryPath: "",
    projectPath: args["--machine-key-path"] || ""
  };
}
exports.getOptions = getOptions;

async function deployRequirements(
  platform,
  additionalRequirements,
  additionalChecks
) {
  const status = new Spinner(
    `Checking for ${platform.toUpperCase()} Deployment Requirements...`
  );
  status.start();

  var count_requirements = 2;
  var count_checks = 0;
  var deploy_platform = platform;

  let listOfRequirements = [
    {
      title: "Basic Automation",
      task: () => {
        return new Listr(
          [
            {
              title: "Checking for Ansible",
              task: (ctx, task) =>
                execa("ansible", ["--version"])
                  .then(result => {
                    if (
                      result.stdout.includes("ansible python module location")
                    ) {
                      count_checks++;
                    } else {
                      task.skip("Ansible not available");
                      throw new Error("Ansible not available");
                    }
                  })
                  .catch(() => {
                    ctx.ansible = false;
                    task.skip("Ansible not available");
                    throw new Error("Ansible not available");
                  })
            },
            {
              title: "Checking for Terraform",
              task: (ctx, task) =>
                execa("terraform", ["-v"])
                  .then(result => {
                    if (result.stdout.includes("Terraform v")) {
                      count_checks++;
                    } else {
                      task.skip("Terraform not available");
                      throw new Error("Terraform not available");
                    }
                  })
                  .catch(() => {
                    ctx.ansible = false;
                    task.skip("Terraform not available");
                    throw new Error("Terraform not available");
                  })
            }
          ],
          { concurrent: false }
        );
      }
    }
  ];

  if (!_.isEmpty(additionalRequirements)) {
    listOfRequirements.push(additionalRequirements);
    count_requirements += additionalChecks;
  }

  //console.log(listOfRequirements);

  const deployReq = new Listr(listOfRequirements);

  await deployReq
    .run()
    .then(result => {
      if (count_checks >= count_requirements) {
        //console.log("\n");
        console.log(
          `%s All ${count_checks} of ${count_requirements} (${deploy_platform.toUpperCase()}) Deployment Requirement(s) passed`,
          chalk.green.bold("Success")
        );
        console.log("\n");

        status.stop();
      } else {
        //console.log("\n");
        console.log(
          `%s ${count_checks} of ${count_requirements} (${deploy_platform.toUpperCase()}) Deployment Requirement(s) passed. All must be met to proceed`,
          chalk.yellow.bold("Warning")
        );
        console.log("\n");

        process.exit(1);
      }
    })
    .catch(err => {
      //console.log("\n");
      console.error(
        `%s (${deploy_platform.toUpperCase()}) Deployment Requirements failed: ` +
          err,
        chalk.red.bold("CLI")
      );
      console.log("\n");
      process.exit(1);
    });
}

exports.deployRequirements = deployRequirements;

async function checkRequirements(options, service = "") {
  if (options.deployPlatform == "local") {
    //we may want to add  new requirements for local in future or extract some of standard ones and not  require  them of everyone
    return options;
  }

  if (options.deployPlatform == "aws") {
    let optionsPlatform = await aws.cliRequirements(options);
    let req = aws.deployRequirements(options, service); // extract specific AWS Deployment requirements
    await deployRequirements("aws", req[0], req[1]);
    return optionsPlatform;
  }

  if (options.deployPlatform == "azure") {
    let optionsPlatform = await azure.cliRequirements(options);
    let req = azure.deployRequirements(options, service); // extract specific Azure Deployment requirements
    await deployRequirements("azure", req[0], req[1]);
    return optionsPlatform;
  }

  if (options.deployPlatform == "github") {
    let optionsPlatform = await github.cliRequirements(options);
    let req = github.deployRequirements(options, service); // extract specific Azure Deployment requirements
    await deployRequirements("github", req[0], req[1]);
    return optionsPlatform;
  }

  if (options.deployPlatform == "linux") {
    let optionsPlatform = await linux.cliRequirements(options);
    let req = linux.deployRequirements(options, service); // extract specific Azure Deployment requirements
    await deployRequirements("linux", req[0], req[1]);
    return optionsPlatform;
  }
}

exports.checkRequirements = checkRequirements;
