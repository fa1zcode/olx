var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt");
var path = require("path");
const helpers = require("../helpers/utility");
const saltRounds = 10;

/* GET home page. */
module.exports = function (db) {
  router.get("/", function (req, res, next) {
    

    const url =
      req.url == "/"
        ? "/ads?page=1&sortBy=id&sortMode=asc"
        : req.url.replace("/", "/ads");

    const params = [];

    if (req.query.title) {
      params.push(`title ilike '%${req.query.title}%'`);
    }

    if (req.query.description) {
      params.push(`description ilike '%${req.query.description}%'`);
    }

    if (req.query.category) {
      params.push(`category = ${req.query.category}`);
    }

    const page = req.query.page || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    let sql = "select count(*) as total from ads";
    if (params.length > 0) {
      sql += ` where ${params.join(" and ")}`;
    }
    db.query(sql, (err, data) => {
      const jumlahHalaman = Math.ceil(data.rows[0].total / limit);
      sql = "select * from ads";
      if (params.length > 0) {
        sql += ` where ${params.join(" and ")}`;
      }
      req.query.sortMode = req.query.sortMode || "asc";

      req.query.sortBy = req.query.sortBy || "id";

      sql += ` order by ${req.query.sortBy} ${req.query.sortMode}`;

      sql += " limit $1 offset $2";
      db.query(sql, [limit, offset], (err, data) => {
        if (err) return res.send(err);
        db.query("select * from categories order by id", (err, categories) => {
          if (err) return res.send(err);
          db.query("select * from users order by id", (err, users) => {
            if (err) return res.send(err);
            console.log(data.rows)
            res.render("index", {
              data: data.rows,
              page,
              jumlahHalaman,
              query: req.query,
              url,
              user: req.session.user,
              categories: categories.rows,
              users: users.rows,
              successMessage: req.flash("successMessage"),
              path: req.originalUrl,
            });
          });
        });
      });
    });
  });

  router.get("/login", function (req, res) {
    res.render("login", { loginMessage: req.flash("loginMessage") });
  });

  router.post("/login", function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    db.query("select * from users where email = $1", [email], (err, user) => {
      if (err) {
        req.flash("loginMessage", "Gagal Login");
        return res.redirect("/login");
      }
      if (user.rows.length == 0) {
        req.flash("loginMessage", "User Tidak Ditemukan");
        return res.redirect("/login");
      }
      bcrypt.compare(password, user.rows[0].pass, function (err, result) {
        if (result) {
          req.session.user = user.rows[0];
          if (user.rows[0].isadmin) {
            res.redirect("/ads");
          } else {
            res.redirect("/");
          }
        } else {
          req.flash("loginMessage", "Password salah");
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
    const fullname = req.body.fullname;
    const password = req.body.password;

    bcrypt.hash(password, saltRounds, function (err, hash) {
      db.query(
        "insert into users (email, pass, fullname, isadmin) values ($1, $2, $3, $4)",
        [email, hash, fullname, false],
        (err) => {
          if (err) return res.send("register gagal");
          res.redirect("/login");
        }
      );
    });
  });

  router.get("/logout", function (req, res) {
    req.session.destroy(function (err) {
      res.redirect("/login");
    });
  });

  return router;
};
