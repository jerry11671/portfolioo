const request = require("supertest");

const { userModel, notificationModel } = require("../models/index");
const app = require("../../app");
const { createUser, createNotification } = require("./helpers/index");

const req = request(app);

const base_url = "/api/v1/user";

describe("NOTIFICATIONS", () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await createUser();
    notification = await createNotification();
  });

  afterEach(() => {
    userModel.deleteMany({});
    notificationModel.deleteMany({});
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

  describe("LIST", () => {
    it("should return status 401 if user is not logged in", async () => {
      const res = await req.get(`${base_url}/notifications`);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if notifications is listed", async () => {
      await createNotification();

      const res = await req
        .get(`${base_url}/notifications`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(200);
    });
  });

  describe("COUNT", () => {
    it("should return status 200 if notification count is returned", async () => {
      const res = await req
        .get(`${base_url}/notifications/availability`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
        data: expect.any(Object),
      });
    });
  });

  describe("DELETE", () => {
    it("should return status 200 if notification is deleted", async () => {
      const res = await req
        .delete(`${base_url}/notifications/${notification._id}`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });
});
