const { execSync } = require("child_process");

const targetFolder = process.argv[2];
const folderToCheck = `${targetFolder}/`;

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
