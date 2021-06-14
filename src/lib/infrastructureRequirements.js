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
const pipeline = require(path.join(
  __dirname,
  "../infrastructure/pipeline/pipeline.js"
));

function getArgs() {
  return {
    "--aws-instance-type": String,
    "--aws-instance-size": String,
    "--registry-name": String,
    "--repository-name": String,
    "--repository-description": String,
    "--repository-visibility": String,
    "--pipeline-name": String
  };
}
exports.getArgs = getArgs;

function getOptions(args) {
  return {
    deployAWSInstanceType: args["--aws-instance-type"] || "t2.micro",
    deployAWSInstanceSize: args["--aws-instance-size"] || 1,
    registryName: args["--registry-name"] || "",
    repositoryName: args["--repository-name"] || "",
    repositoryDescription:
      args["--repository-description"] || "A New Repository",
    repositoryVisibility: args["--repository-visibility"] || "private",
    pipelineName: args["--pipeline-name"] || "Modullo Pipeline"
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
    // optionsInfrastructure = await vm.cliRequirements(options); // require specific VM CLI requirements
    // return optionsInfrastructure;
    return options;
  }
  if (options.createInfrastructure == "pipeline") {
    optionsInfrastructure = await pipeline.cliRequirements(options); // require specific Pipeline CLI requirements
    return options;
  }
}

exports.checkRequirements = checkRequirements;
