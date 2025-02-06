const request = require("supertest");

const { userModel } = require("../models/index");
const app = require("../../app");
const { createUser } = require("./helpers/index");

const req = request(app);

const base_url = "/api/v1/user";

describe("USERS", () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await createUser();
  });

  afterEach(() => {
    userModel.deleteMany({});
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

  describe("SINGLE", () => {
    it("should return status 200 if profile is returned", async () => {
      const res = await req
        .get(`${base_url}/me`)
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
    it("should return status 400 if email is empty", async () => {
      const res = await req
        .patch(`${base_url}/me`)
        .auth(token, { type: "bearer" })
        .send({
          email: "",
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if user is edited", async () => {
      const res = await req
        .patch(`${base_url}/me`)
        .auth(token, { type: "bearer" })
        .send({
          email: `user${Date.now()}@yopmail.com`,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("DELETE", () => {
    it("should return status 200 if user is deleted", async () => {
      const res = await req
        .delete(`${base_url}/me`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });
});
