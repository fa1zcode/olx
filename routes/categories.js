var express = require("express");
var router = express.Router();
var path = require("path");
const helpers = require("../helpers/utility");


/* GET home page. */
module.exports = function (db) {
  router.get("/", helpers.isLoggedIn, function (req, res) {
    const url =
      req.url == "/"
        ? "/categories?page=1&sortBy=id&sortMode=asc"
        : req.url.replace("/", "/categories");
    console.log(url);

    const params = [];

    if (req.query.name) {
      params.push(`name ilike '%${req.query.name}%'`);
    }

    const page = req.query.page || 1;
    const limit = 3;
    const offset = (page - 1) * limit;
    let sql = "select count(*) as total from categories";
    if (params.length > 0) {
      sql += ` where ${params.join(" and ")}`;
    }
    db.query(sql, (err, data) => {
      const jumlahHalaman = Math.ceil(data.rows[0].total / limit);
      sql = "select * from categories";
      if (params.length > 0) {
        sql += ` where ${params.join(" and ")}`;
      }
      req.query.sortMode = req.query.sortMode || "asc";

      req.query.sortBy = req.query.sortBy || "id";

      sql += ` order by ${req.query.sortBy} ${req.query.sortMode}`;

      sql += " limit $1 offset $2";
      db.query(sql, [limit, offset], (err, data) => {
        if (err) return res.send(err);
        res.render("admin/categories/list", {
          data: data.rows,
          page,
          jumlahHalaman,
          query: req.query,
          url,
          user: req.session.user,
          successMessage: req.flash("successMessage"),
        });
      });
    });
  });

  router.get("/add", helpers.isLoggedIn, function (req, res) {
    res.render("admin/categories/form", {
      data: {},
      user: req.session.user,
    });
  });

  router.post("/add", function (req, res) {
    db.query(
      "insert into categories(name) values ($1)",
      [req.body.name],
      (err) => {
        if (err) return res.send(err);
        res.redirect("/categories");
      }
    );
  });

  router.get("/delete/:id", helpers.isLoggedIn, function (req, res) {
    const id = Number(req.params.id);
    db.query("delete from categories where id = $1 ", [id], (err) => {
      if (err) return res.send(err);
      req.flash("successMessage", `ID : ${id} berhasil dihapus`);

      res.redirect("/categories");
    });
  });

  router.get("/edit/:id", helpers.isLoggedIn, function (req, res) {
    const id = Number(req.params.id);
    db.query("select * from categories where id = $1", [id], (err, raws) => {
      if (err) return res.send(err);
      res.render("admin/categories/form", {
        data: raws.rows[0],
        user: req.session.user,
      });
    });
  });

  router.post("/edit/:id", helpers.isLoggedIn, function (req, res) {
    const id = Number(req.params.id);
    db.query(
      "update categories set name = $1 where id = $2",
      [req.body.name, id],
      (err, raws) => {
        console.log(err);
        if (err) return res.send(err);
        //res.render('edit', { data: raws })
        res.redirect("/categories");
      }
    );
  });

  return router;
};
