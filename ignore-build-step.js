const { execSync } = require("child_process");

const targetFolder = process.argv[2];
const folderToCheck = `${targetFolder}/`;
const branchName = process.env.VERCEL_GIT_COMMIT_REF;

let allowedPattern = /./;
if (targetFolder == "slack") {
  allowedPattern = /^slack\//;
} else if (targetFolder === "frontend") {
  allowedPattern = /^frontend\//;
}

if (!allowedPattern.test(branchName)) {
  console.log(
    `Branch ${branchName} does not match the allowed pattern. Build will be aborted.`
  );
  process.exit(0);
}

try {
  const changedFiles = execSync(
    `bash -c "git diff --name-only HEAD HEAD~1"`
  ).toString();

  console.log("Changed files:", changedFiles);

  if (!changedFiles) {
    console.log("No files changed.");
    process.exit(0);
  }

  const isRelevantChange = changedFiles
    .split("\n")
    .some((file) => file.startsWith(folderToCheck));

  if (!isRelevantChange) {
    console.log(`No relevant changes in '${folderToCheck}'. Aborting build.`);
    process.exit(0);
  } else {
    console.log(
      `Relevant changes detected in '${folderToCheck}'. Continuing build.`
    );
    process.exit(1);
  }
} catch (error) {
  console.error("Error while checking for changed folders:", error);
  process.exit(1);
}
