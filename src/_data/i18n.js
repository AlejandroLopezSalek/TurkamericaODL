const index = require("./i18n/index.json");
const labCapi = require("./i18n/labCapi.json");
const exams = require("./i18n/exams.json");
const story = require("./i18n/storyLab.json");
const dna = require("./i18n/dna.json");
const analysis = require("./i18n/analysis.json");
const levels = require("./i18n/levels.json");
const grammar = require("./i18n/grammar.json");
const glossary = require("./i18n/glossary.json");
const common = require("./i18n/common.json");
const login = require("./i18n/login.json");
const register = require("./i18n/register.json");
const dashboard = require("./i18n/dashboard.json");
const profile = require("./i18n/profile.json");
const storyLab = require("./i18n/storyLab.json");
const community = require("./i18n/community.json");
const resources = require("./i18n/resources.json");
const privacy = require("./i18n/privacy.json");
const tips = require("./i18n/tips.json");
const admin = require("./i18n/admin.json");

// Helper to access common translations easily
const commonByCode = common.reduce((acc, curr) => {
  acc[curr.code] = curr;
  return acc;
}, {});

module.exports = {
  index,
  labCapi,
  exams,
  story,
  dna,
  analysis,
  levels,
  grammar,
  glossary,
  login,
  register,
  dashboard,
  profile,
  storyLab,
  community,
  resources,
  privacy,
  tips,
  admin,
  common,
  commonByCode
};

