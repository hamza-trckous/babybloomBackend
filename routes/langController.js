const ar = require("../locals/ar.json");
const en = require("../locals/en.json");

const getTranslation = (req, res) => {
  const lang = req.query?.lang || "EN";
  let translation = en;

  if (lang === "AR") {
    translation = ar;
  }

  res.json(translation);
};

module.exports = { getTranslation };
