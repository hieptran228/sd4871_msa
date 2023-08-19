const express = require("express");
const serverResponses = require("../utils/helpers/responses");
const messages = require("../config/messages");
const { Todo } = require("../models/todos/todo");
const Prometheus = require("prom-client");

const routes = (app) => {
  const router = express.Router();
  router.use(function (req, res, next) {
    // Start a timer for every request made
    res.locals.startEpoch = Date.now();
    next();
  });

  const register = new Prometheus.Registry();
  register.setDefaultLabels({
    app: "backend",
  });
  Prometheus.collectDefaultMetrics({ register });

  const http_request_counter = new Prometheus.Counter({
    name: "http_request_count",
    help: "Count of HTTP requests made to backend",
    labelNames: ["method", "route", "statusCode"],
  });
  register.registerMetric(http_request_counter);

  const http_request_duration_milliseconds = new Prometheus.Histogram({
    name: "http_request_duration_milliseconds",
    help: "Duration of HTTP requests in milliseconds.",
    labelNames: ["method", "route", "code"],
    buckets: [1, 2, 3, 4, 5, 10, 25, 50, 100, 250, 500, 1000],
  });
  register.registerMetric(http_request_duration_milliseconds);

  router.post("/todos", (req, res) => {
    const todo = new Todo({
      text: req.body.text,
    });

    todo
      .save()
      .then((result) => {
        serverResponses.sendSuccess(req, res, messages.SUCCESSFUL, result);
      })
      .catch((e) => {
        serverResponses.sendError(req, res, messages.BAD_REQUEST, e);
      });
  });

  router.get("/", (req, res) => {
    Todo.find({}, { __v: 0 })
      .then((todos) => {
        serverResponses.sendSuccess(req, res, messages.SUCCESSFUL, todos);
      })
      .catch((e) => {
        serverResponses.sendError(req, res, messages.BAD_REQUEST, e);
      });
  });

  router.get("/metrics", function (req, res) {
    res.setHeader("Content-Type", register.contentType);
    register.metrics().then((data) => res.status(200).send(data));
  });

  //it's a prefix before api it is useful when you have many modules and you want to
  //differentiate b/w each module you can use this technique
  app.use("/api", router);
};
module.exports = routes;
