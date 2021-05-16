const path = require("path");
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

function getArgs() {
  return {
    "--software-package-type": String,
    "--software-package": String,
    "--app-user": String
  };
}
exports.getArgs = getArgs;

function getOptions(args) {
  return {
    softwarePackageType: args["--software-package-type"] || "single",
    softwarePackage: args["--software-package"] || "custom",
    appUser: args["--app-user"] || "user"
  };
}
exports.getOptions = getOptions;

async function checkRequirements(options, service = "") {
  if (options.installFramework == "wordpress") {
    optionsFramework = await wordpress.cliRequirements(options); // require specific Wordpress CLI requirements
    // wordpress.createInit(options);
    return optionsFramework;
  }
  if (options.installFramework == "modullo") {
    optionsFramework = await modullo.cliRequirements(options); // require specific Wordpress CLI requirements
    // wordpress.createInit(options);
    return optionsFramework;
  }
  if (options.installFramework == "software") {
    optionsFramework = await software.cliRequirements(options); // require specific Wordpress CLI requirements
    // wordpress.createInit(options);
    return optionsFramework;
  }
}

exports.checkRequirements = checkRequirements;
