const request = require("supertest");

const { userModel, trailModel } = require("../models/index");
const app = require("../../app");
const { createAdmin, createTrail } = require("./helpers/index");

const req = request(app);

const base_url = "/api/v1/admin";

describe("TRAILS", () => {
  let admin;
  let token;
  let trail;

  beforeEach(async () => {
    admin = await createAdmin();
    trail = await createTrail();
  });

  afterEach(() => {
    userModel.deleteMany({});
    trailModel.deleteMany({});
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

  describe("LIST", () => {
    it("should return status 401 if admin is not logged in", async () => {
      const res = await req.get(`${base_url}/trails`);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if trails is listed", async () => {
      const res = await req
        .get(`${base_url}/trails`)
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
});
