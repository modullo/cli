const path = require("path");

const modullo = require(path.join(
  __dirname,
  "../frameworks/modullo/Modullo.js"
));
const containerRegistry = require(path.join(
  __dirname,
  "../iaas/container-registry/containerRegistry.js"
));

async function checkRequirements(options, service = "") {
  if (options.createInfrastructure == "container-registry") {
    optionsInfrastructure = await containerRegistry.cliRequirements(options); // require specific Container CLI requirements
    return optionsInfrastructure;
  }
}

exports.checkRequirements = checkRequirements;
