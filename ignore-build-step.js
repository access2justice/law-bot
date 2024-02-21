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
    `Branch ${branchName} entspricht nicht dem erlaubten Muster. Build wird abgebrochen.`
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
      `Keine Änderungen im Ordner '${folderToCheck}' festgestellt. Build wird übersprungen.`
    );
    process.exit(0);
  } else {
    console.log(
      `Änderungen im Ordner '${folderToCheck}' festgestellt. Build wird fortgesetzt.`
    );
  }
} catch (error) {
  console.error("Fehler beim Überprüfen der geänderten Ordner:", error);
  process.exit(1);
}
