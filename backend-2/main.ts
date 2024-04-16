import LawArticleTree from "./search/law-article-tree";

require("dotenv").config();

const run = async () => {
  const lawArticleTree = new LawArticleTree(
    "Ich habe mich mit einem Autohändler über den Kauf eines VW-Polo, Chassisnummer 2398777, zum Preis von CHF 15'000 geeinigt. Ich erklärte, dass ich den Wagen erst am übernächsten Tag abholen werde. In der Nacht wurde jedoch von einem Dritten ein Feuer gelegt, wodurch der Wagen vollständig zerstört wurde. Wie ist nun die rechtliche Situation in Bezug auf den Kaufpreis?"
  );
  const exec = await lawArticleTree.exec();

  console.log(exec);
};

run();
