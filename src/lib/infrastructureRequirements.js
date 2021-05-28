const path = require("path");

const modullo = require(path.join(
  __dirname,
  "../frameworks/modullo/Modullo.js"
));
const containerRegistry = require(path.join(
  __dirname,
  "../infrastructure/container-registry/containerRegistry.js"
));
const repository = require(path.join(
  __dirname,
  "../infrastructure/repository/repository.js"
));

function getArgs() {
  return {
    "--registry-name": String,
    "--repository-name": String,
    "--repository-description": String,
    "--repository-visibility": String
  };
}
exports.getArgs = getArgs;

function getOptions(args) {
  return {
    registryName: args["--registry-name"] || "",
    repositoryName: args["--repository-name"] || "",
    repositoryDescription:
      args["--repository-description"] || "A New Repository",
    repositoryVisibility: args["--repository-visibility"] || "private"
  };
}
exports.getOptions = getOptions;

async function checkRequirements(options, service = "") {
  if (options.createInfrastructure == "container-registry") {
    optionsInfrastructure = await containerRegistry.cliRequirements(options); // require specific Container CLI requirements
    return optionsInfrastructure;
  }
  if (options.createInfrastructure == "repository") {
    optionsInfrastructure = await repository.cliRequirements(options); // require specific Repository CLI requirements
    return optionsInfrastructure;
  }
  if (options.createInfrastructure == "vm") {
    // optionsInfrastructure = await repository.cliRequirements(options); // require specific Repository CLI requirements
    // return optionsInfrastructure;
    return options;
  }
}

exports.checkRequirements = checkRequirements;
