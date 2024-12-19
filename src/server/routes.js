const { postPredictHandler, getPredictionHistoriesHandler } = require("../server/handler");

const routes = [
  {
    path: "/predict",
    method: "POST",
    handler: postPredictHandler,
    options: {
      payload: {
        allow: "multipart/form-data",
        multipart: true,
      },
    },
  },
  {
    method: "GET",
    path: "/",
    handler: (request, h) => {
      return "Welcome to the API!";
    },
  },
  {
    method: "GET",
    path: "/predict/histories",
    handler: getPredictionHistoriesHandler,
  },
];

module.exports = routes;
