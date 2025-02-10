const request = require("supertest");

const bcrypt = require("bcrypt");
const { adminModel } = require("../models/index");
const app = require("../../app");
const { createAdmin } = require("./helpers/index");

const req = request(app);

const base_url = "/api/v1/admin";

describe("ADMINS", () => {
  let admin;
  let token;

  beforeEach(async () => {
    admin = await createAdmin();
  });

  afterEach(() => {
    adminModel.deleteMany({});
  });

  describe("LOGIN", () => {
    it("should return status 200 if login credentials is correct", async () => {
      const res = await req
        .post(`${base_url}/auths/login`)
        .send({ id: admin.email, password: "password" });

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
    it("should return status 400 if role is not entered", async () => {
      const res = await req
        .post(`${base_url}/teams`)
        .auth(token, { type: "bearer" })
        .send({
          first_name: "John",
          last_name: "Doe",
          email: `admin${Date.now()}@yopmail.com`,
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 201 if admin is created", async () => {
      const res = await req
        .post(`${base_url}/teams`)
        .auth(token, { type: "bearer" })
        .send({
          first_name: "John",
          last_name: "Doe",
          email: `admin${Date.now()}@yopmail.com`,
          role: "Admin",
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("LIST", () => {
    it("should return status 401 if admin is not logged in", async () => {
      const res = await req.get(`${base_url}/teams`);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if team is listed", async () => {
      const res = await req
        .get(`${base_url}/teams`)
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
    it("should return status 404 if admin is not found", async () => {
      const res = await req
        .get(`${base_url}/teams/${"611109c2c43758b95308f69a"}`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if admin is found", async () => {
      const res = await req
        .get(`${base_url}/teams/${admin._id}`)
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
        .patch(`${base_url}/teams/${admin._id}`)
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

    it("should return status 200 if admin is edited", async () => {
      const res = await req
        .patch(`${base_url}/teams/${admin._id}`)
        .auth(token, { type: "bearer" })
        .send({
          email: `admin${Date.now()}@yopmail.com`,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("UPDATE STATUS", () => {
    it("should return status 200 if admin status is updated", async () => {
      let new_admin = new adminModel({
        first_name: "Jane",
        last_name: "Admin",
        email: `admin${Date.now()}@yopmail.com`,
        password: bcrypt.hashSync("password", 8),
        role: "Admin",
      });

      new_admin = await new_admin.save();

      const res = await req
        .patch(`${base_url}/teams/${new_admin._id}/update-status`)
        .auth(token, { type: "bearer" })
        .send({
          status: false,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });
});
