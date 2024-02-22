const { execSync } = require("child_process");

const branchName = process.env.VERCEL_GIT_COMMIT_REF;
var targetFolder = process.argv[2];

const folderToCheck = targetFolder + "/";
const mainBranch = "master";

try {
  const changedFiles = execSync(
    `git diff --name-only ${mainBranch}...HEAD`
  ).toString();

  const isRelevantChange = changedFiles
    .split("\n")
    .some((file) => file.startsWith(folderToCheck));

  if (!isRelevantChange) {
    console.log(`No relevant changes in '${folderToCheck}'. Skipping build.`);
    execSync('echo "Skipping build due to no relevant changes."');
    process.exit(0);
  } else {
    console.log(
      `Relevant changes detected in '${folderToCheck}'. Proceeding with build.`
    );
  }
} catch (error) {
  console.error("Error while checking for changed folders:", error);
  process.exit(1);
}
