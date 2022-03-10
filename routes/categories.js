var express = require("express");
var router = express.Router();
var path = require("path");
const helpers = require("../helpers/utility");

/* GET home page. */
module.exports = function (db) {
  router.get("/", helpers.isLoggedIn, function (req, res) {
    const url = req.url == "/" ? "/?page=1" : req.url;
    console.log(url);

    const params = [];

    if (req.query.name) {
      params.push(`name ilike '${req.query.name}' `);
    }

    const page = req.query.page || 1; // if no req.query.page, page = 1
    const limit = 3; // limit 3 items in one page
    const offset = (page - 1) * limit;
    let sql = "select count(*) as total from categories";

    if (params.length > 0) {
      sql += ` where ${params.join(" and ")}`;
    }

    db.query(sql, (err, raws) => {
      const jumlahHalaman = Math.ceil(raws.rows[0].total / limit);
      sql = "select * from categories";
      if (params.length > 0) {
        sql += ` where ${params.join(" and ")}`;
      }
      sql += ` limit $1 offset $2`;
      console.log(sql);
      db.query(sql, [limit, offset], (err, data) => {
        if (err) return res.send(err);
        //console.log(raws)
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
    res.render("add");
  });

  router.post("/add", helpers.isLoggedIn, function (req, res) {
    task = req.body.task;
    // query binding = use (?) to prevent hack via sql injection
    db.query(
      "insert into todo(task, userid) values (?,?) ",
      [task, req.session.user.id],
      (err, raws) => {
        if (err) return res.send(err);
        console.log(raws);
        res.redirect("/");
      }
    );
  });

  router.get("/delete/:id", helpers.isLoggedIn, function (req, res) {
    const id = Number(req.params.id);
    db.query("delete from todo where id = ? ", [id], (err, raws) => {
      if (err) return res.send(err);
      req.flash("loginMessage", "Task berhasil dihapus");
      console.log(raws);
      res.redirect("/");
    });
  });

  router.get("/edit/:id", helpers.isLoggedIn, function (req, res) {
    const id = Number(req.params.id);
    db.query("select * from todo where id = ?", [id], (err, raws) => {
      console.log(err);
      if (err) return res.send(err);
      res.render("edit", { data: raws });
    });
  });

  router.post("/edit/:id", helpers.isLoggedIn, function (req, res) {
    const id = Number(req.params.id);
    task = req.body.task;
    complete = JSON.parse(req.body.complete);
    db.query(
      "update todo set task = (?), complete = (?) where id = ?",
      [task, complete, id],
      (err, raws) => {
        console.log(err);
        if (err) return res.send(err);
        //res.render('edit', { data: raws })
        res.redirect("/");
      }
    );
  });

  return router;
};
