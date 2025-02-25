/**
 * THIS SCRIPT SERVES AS A TEMPLATE
 *
 * IT IS NOT INCLUDED IN THE RUNNING TEST SUITES
 * SO IT WON'T BE PART OF THE REPORT
 * SEE 'jest.testPathIgnorePatterns' IN package.json
 *
 * HOW TO USE THIS TEMPLATE:
 * COPY THIS FILE AND RENAME COPIED FILE OR
 * COPY SCRIPTS IN THIS FILE TO ANOTHER FILE
 */

const request = require("supertest");

const { userModel, exampleModel } = require("../models/index");
const app = require("../../app");
const { createUser, createExample } = require("./helpers/index");

const req = request(app);

const base_url = "/api/v1/user";

describe("EXAMPLES", () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await createUser();
    example = await createExample();
  });

  afterEach(() => {
    userModel.deleteMany({});
    exampleModel.deleteMany({});
  });

  describe("LOGIN", () => {
    it("should return status 200 if login credentials is correct", async () => {
      const res = await req
        .post(`${base_url}/auths/login`)
        .send({ id: user.email, password: "password" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
        data: expect.any(Object),
      });
      expect(res.body.data).toHaveProperty("token");

      token = res.body.data.token;
    });
  });

  describe("CREATE", () => {
    it("should return status 400 if title is not entered", async () => {
      const res = await req
        .post(`${base_url}/examples`)
        .auth(token, { type: "bearer" })
        .send({
          title: "",
          description: example.description,
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 201 if example is created", async () => {
      const res = await req
        .post(`${base_url}/examples`)
        .auth(token, { type: "bearer" })
        .send({
          title: example.title,
          description: example.description,
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("LIST", () => {
    it("should return status 401 if user is not logged in", async () => {
      const res = await req.get(`${base_url}/examples`);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if examples is listed", async () => {
      const res = await req
        .get(`${base_url}/examples`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
      expect(res.body.data).toHaveProperty("metadata");
      expect(res.body.data).toHaveProperty("data");
    });
  });

  describe("SINGLE", () => {
    it("should return status 404 if example is not found", async () => {
      const res = await req
        .get(`${base_url}/examples/${"611109c2c43758b95308f69a"}`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if example is found", async () => {
      const res = await req
        .get(`${base_url}/examples/${example._id}`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
        data: expect.any(Object),
      });
    });
  });

  describe("EDIT", () => {
    it("should return status 400 if description is not entered", async () => {
      const res = await req
        .patch(`${base_url}/examples/${example._id}`)
        .auth(token, { type: "bearer" })
        .send({
          title: example.description,
          description: "",
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if example is edited", async () => {
      const res = await req
        .patch(`${base_url}/examples/${example._id}`)
        .auth(token, { type: "bearer" })
        .send({
          title: "edited title",
          description: "edited description",
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("DELETE", () => {
    it("should return status 200 if example is deleted", async () => {
      const res = await req
        .delete(`${base_url}/examples/${example._id}`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });
});
