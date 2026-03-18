const levelsData = require("./i18n/levels.json");

module.exports = function () {
  const result = [];
  levelsData.forEach((lang) => {
    Object.keys(lang.levels).forEach((levelKey) => {
      // Create a specific page entry for EACH level in EACH language
      result.push({
        code: lang.code,
        dir: lang.dir,
        levelKey: levelKey, // A1, A2, etc.
        t: lang.levels[levelKey], // Level-specific translations
        ui: lang // General UI translations (search, labels, etc.)
      });
    });
  });
  return result;
};
