const { execSync } = require("child_process");

const branchName = process.env.VERCEL_GIT_COMMIT_REF;

var folder = process.argv[2];

let allowedPattern = /./;
if (folder == "slack") {
  allowedPattern = /^slack\//;
} else if (folder === "frontend") {
  allowedPattern = /^frontend\//;
}

if (!allowedPattern.test(branchName)) {
  console.log(
    `Branch ${branchName} does not match the allowed pattern. Build will be aborted.`
  );
  process.exit(1);
}

const folderToCheck = "slack/";
const mainBranch = "master";

try {
  const changedFiles = execSync(
    `git diff --name-only ${mainBranch}`
  ).toString();

  const isRelevantChange = changedFiles
    .split("\n")
    .some((file) => file.startsWith(folderToCheck));

  if (!isRelevantChange) {
    console.log(
      `No changes detected in the '${folderToCheck}' folder. Build will be skipped.`
    );
    process.exit(0);
  } else {
    console.log(
      `Changes detected in the '${folderToCheck}' folder. Build will continue.`
    );
  }
} catch (error) {
  console.error("Error while checking for changed folders:", error);
  process.exit(1);
}
