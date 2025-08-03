const setLanguageAndColor = (req, res, next) => {
  const LangCookie = req.cookies.language;
  const ColorCookie = req.cookies.ColorText;
  let lang = "EN";
  let colo = "teal";
  if (LangCookie) {
    lang = LangCookie;
  } else if (req.query.lang) {
    lang = req.query.lang;
  }
  if (ColorCookie) {
    colo = ColorCookie;
  } else if (req.query.ColorText) {
    colo = req.query.ColorText;
  }
  res.cookie("language", lang, { maxAge: 900000 });
  // res.cookie("ColorText", colo, { maxAge: 900000, httpOnly: true });

  req.language = lang;

  next();
};

module.exports = setLanguageAndColor;
