var express = require("express");
var router = express.Router();
const helpers = require('../helpers/utility')

/* GET home page. */
module.exports = function (db) {
  router.get("/", helpers.isLoggedIn, function (req, res) {
    const url = req.url == "/" ? "/?page=1" : req.url;
    console.log(url);

    const params = [];
    params.push(`userid = ${req.session.user.id}`);

    if (req.query.task) {
      params.push(`task like '${req.query.task}' `);
    }

    if (req.query.complete) {
      params.push(`complete = ${req.query.complete}`);
    }

    const page = req.query.page || 1; // if no req.query.page, page = 1
    const limit = 3; // limit 3 items in one page
    const offset = (page - 1) * limit;
    let sql = "select count(*) as total from todo";

    if (params.length > 0) {
      sql += ` where ${params.join(" and ")}`;
    }

    db.get(sql, (err, raws) => {
      const jumlahHalaman = Math.ceil(raws.total / limit);
      sql = "select * from todo";
      if (params.length > 0) {
        sql += ` where ${params.join(" and ")}`;
      }
      sql += ` limit ? offset ?`;
      console.log(sql);
      db.all(sql, [limit, offset], (err, raws) => {
        if (err) return res.send(err);
        //console.log(raws)
        res.render("list", {
          data: raws,
          page,
          jumlahHalaman,
          query: req.query,
          url,
          user: req.session.user,
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
    db.run(
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
    db.run("delete from todo where id = ? ", [id], (err, raws) => {
      if (err) return res.send(err);
      req.flash("loginMessage", "Task berhasil dihapus");
      console.log(raws);
      res.redirect("/");
    });
  });

  router.get("/edit/:id", helpers.isLoggedIn, function (req, res) {
    const id = Number(req.params.id);
    db.get("select * from todo where id = ?", [id], (err, raws) => {
      console.log(err);
      if (err) return res.send(err);
      res.render("edit", { data: raws });
    });
  });

  router.post("/edit/:id", helpers.isLoggedIn, function (req, res) {
    const id = Number(req.params.id);
    task = req.body.task;
    complete = JSON.parse(req.body.complete);
    db.get(
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
