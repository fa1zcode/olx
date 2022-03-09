var express = require("express");
var router = express.Router();

/* GET home page. */
module.exports = function (db) {
  router.get("/", function (req, res, next) {
    res.render("index", { title: "Express" });
  });

  router.get("/login", function (req, res) {
    res.render("login", { loginMessage: req.flash("loginMessage") });
  });

  router.post("/login", function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    db.get("select * from user where email = ?", [email], (err, user) => {
      if (err) {
        req.flash("loginMessage", "Login Gagal");
        return res.redirect("/login");
      }
      if (!user) {
        req.flash("loginMessage", "User Tidak Ditemukan");
        return res.redirect("/login");
      }

      bcrypt.compare(password, user.password, function (err, result) {
        // result == true
        if (result) {
          req.session.user = user;
          console.log(req.session.user);
          res.redirect("/");
        } else {
          req.flash("loginMessage", "Password Salah");
          res.redirect("/login");
        }
      });
    });
  });

  router.get("/register", function (req, res) {
    res.render("register");
  });

  router.post("/register", function (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const fullname = req.body.fullname;

    bcrypt.hash(password, saltRounds, function (err, hash) {
      // Store hash in your password DB.
      db.run(
        "insert into user (email, password, fullname) values (?,?,?)",
        [email, hash, fullname],
        (err, user) => {
          if (err) return res.send("Register Failed");
          res.redirect("/login");
        }
      );
    });
  });

  router.get("/logout", function (req, res) {
    req.session.destroy(function (err) {
      // cannot access session here
      res.redirect("/login");
    });
  });

  return router;
};
