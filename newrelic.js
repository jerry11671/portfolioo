"use strict";

const key = process.env.NEW_RELIC_LICENSE_KEY;

const project_code = process.env.PROJECT_CODE;
const project_title = process.env.PROJECT_TITLE;

exports.config = {
  app_name: [`${project_code}-${project_title}-BE`],
  license_key: key,
  logging: {
    level: "info",
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      "request.headers.cookie",
      "request.headers.authorization",
      "request.headers.proxyAuthorization",
      "request.headers.setCookie*",
      "request.headers.x*",
      "response.headers.cookie",
      "response.headers.authorization",
      "response.headers.proxyAuthorization",
      "response.headers.setCookie*",
      "response.headers.x*",
    ],
  },
};
