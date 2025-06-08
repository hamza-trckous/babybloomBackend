const setLanguageAndColor = (req, res, next) => {
  const langCookie = req.cookies.language;
  const ColorCookie = req.cookies.ColorText;
  let lang = "AR";
  let colo = "teal";
  if (langCookie) {
    lang = langCookie;
  } else if (req.query.lang) {
    lang = req.query.lang;
  }
  if (ColorCookie) {
    colo = ColorCookie;
  } else if (req.query.ColorText) {
    colo = req.query.ColorText;
  }
  res.cookie("Language", lang, { maxAge: 900000, httpOnly: true });
  // res.cookie("ColorText", colo, { maxAge: 900000, httpOnly: true });

  req.language = lang;

  next();
};

module.exports = setLanguageAndColor;
