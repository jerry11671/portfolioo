/**
 * LOGS EMAIL NOT SENT ERROR
 * BECAUSE SMTP CREDENTIALS IS NOT INCLUDED IN .env.test
 */

const request = require("supertest");

const { userModel } = require("../models/index");
const app = require("../../app");
const { createUser } = require("./helpers/index");

const req = request(app);

const base_url = "/api/v1/web";

describe("USERS", () => {
  let user;
  let added_member;
  let token;

  beforeEach(async () => {
    user = await createUser();
  });

  afterEach(() => {
    userModel.deleteMany({});
  });

  describe("LOGIN", () => {
    it("should return status 400 if email is invalid", async () => {
      const res = await req
        .post(`${base_url}/auth/login`)
        .send({ email: "error.com", password: "password" });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 400 if email or password is incorrect", async () => {
      const res = await req
        .post(`${base_url}/auth/login`)
        .send({ email: user.email, password: "password123" });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if login credentials is correct", async () => {
      const res = await req
        .post(`${base_url}/auth/login`)
        .send({ email: user.email, password: "password" });

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

  describe("FORGOT PASSWORD", () => {
    it("should return status 404 if user is yet to registered", async () => {
      const res = await req
        .post(`${base_url}/auth/forgot-password`)
        .send({ email: "example@email.com" });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if token is sent to user mail", async () => {
      const res = await req
        .post(`${base_url}/auth/forgot-password`)
        .send({ email: user.email });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("VALIDATE OTP", () => {
    it("should return status 400 if otp is wrong", async () => {
      const res = await req
        .post(`${base_url}/auth/validate-reset-password-token`)
        .send({ email: user.email, verification_code: "12345" });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 400 if otp is expired", async () => {
      user = await userModel.findOne({ email: user.email });

      user = await userModel.findByIdAndUpdate(
        user._id,
        {
          reset_password: {
            token: user.reset_password.token,
            expires_in: new Date().getMinutes() - 1,
          },
        },
        {
          new: true,
        }
      );

      const res = await req
        .post(`${base_url}/auth/validate-reset-password-token`)
        .send({
          email: user.email,
          verification_code: user.reset_password.token,
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if otp is valid", async () => {
      user = await userModel.findOne({ email: user.email });

      user = await userModel.findByIdAndUpdate(
        user._id,
        {
          reset_password: {
            token: user.reset_password.token,
            expires_in: new Date().setMinutes(new Date().getMinutes() + 10),
          },
        },
        {
          new: true,
        }
      );

      const res = await req
        .post(`${base_url}/auth/validate-reset-password-token`)
        .send({
          email: user.email,
          verification_code: user.reset_password.token,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("RESET PASSWORD", () => {
    it("should return status 400 if password and confirm password do not match", async () => {
      user = await userModel.findOne({ email: user.email });

      const res = await req.post(`${base_url}/auth/reset-password`).send({
        email: user.email,
        verification_code: user.reset_password.token,
        password: "password",
        confirm_password: "pass",
      });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if password is reset", async () => {
      user = await userModel.findOne({ email: user.email });

      const res = await req.post(`${base_url}/auth/reset-password`).send({
        email: user.email,
        verification_code: user.reset_password.token,
        password: "password",
        confirm_password: "password",
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("CHANGE PASSWORD", () => {
    it("should return status 401 if users is not logged in", async () => {
      const res = await req.patch(`${base_url}/users/change-password`).send({
        email: user.email,
        old_password: "password",
        new_password: "password1234",
        confirm_password: "password1234",
      });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 400 if old password is incorrect", async () => {
      const res = await req
        .patch(`${base_url}/users/change-password`)
        .auth(token, { type: "bearer" })
        .send({
          email: user.email,
          old_password: "password1234",
          new_password: "password",
          confirm_password: "password",
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if password is changed", async () => {
      const res = await req
        .patch(`${base_url}/users/change-password`)
        .auth(token, { type: "bearer" })
        .send({
          email: user.email,
          old_password: "password",
          new_password: "password1234",
          confirm_password: "password1234",
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("UPDATE USER PROFILE", () => {
    it("should return status 200 if user profile is updated", async () => {
      const res = await req
        .patch(`${base_url}/users/me`)
        .auth(token, { type: "bearer" })
        .send({
          first_name: "Super",
          last_name: "Admin",
          email: "admin.template@yopmail.com",
          role: "admin",
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("LIST TEAMS", () => {
    it("should return status 401 if users is not logged in", async () => {
      const res = await req.get(`${base_url}/users`);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if team is listed", async () => {
      const res = await req
        .get(`${base_url}/users`)
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

  describe("ADD TEAM MEMBER", () => {
    it("should return status 400 if role is not selected", async () => {
      const res = await req
        .post(`${base_url}/users`)
        .auth(token, { type: "bearer" })
        .send({
          first_name: "Jane",
          last_name: "Doe",
          title: "Business Dev",
          email: "jane.doe@team.tbc.ng",
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 201 if member is added", async () => {
      const res = await req
        .post(`${base_url}/users`)
        .auth(token, { type: "bearer" })
        .send({
          first_name: "Mitchel",
          last_name: "Doe",
          title: "Business Dev",
          email: "mitchel.doe@yopmail.com",
          role: "user",
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("GET A TEAM MEMBER", () => {
    it("should return status 404 if member is not found", async () => {
      const res = await req
        .get(`${base_url}/users/${"65e5a7a97f6ef24408deffc3"}`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if member is found", async () => {
      added_member = user = await userModel.findOne({
        email: "mitchel.doe@yopmail.com",
      });

      const res = await req
        .get(`${base_url}/users/${added_member._id}`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("EDIT TEAM MEMBER", () => {
    it("should return status 400 if role is not selected", async () => {
      const res = await req
        .patch(`${base_url}/users/${added_member._id}`)
        .auth(token, { type: "bearer" })
        .send({
          first_name: "Mitchel",
          last_name: "Doe",
          title: "Business Dev",
          email: "mitchel.doe@yopmail.com",
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if member is edited", async () => {
      const res = await req
        .patch(`${base_url}/users/${added_member._id}`)
        .auth(token, { type: "bearer" })
        .send({
          first_name: "Mitchel",
          last_name: "Doe",
          title: "Business Dev",
          email: "mitchel.doe@yopmail.com",
          role: "user",
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("CHANGE TEAM MEMBER STATUS", () => {
    it("should return status 200 if member status is changed", async () => {
      const res = await req
        .patch(`${base_url}/users/change-status?id=${added_member._id}`)
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

  describe("ARCHIVE TEAM MEMBER", () => {
    it("should return status 200 if member is archived", async () => {
      const res = await req
        .patch(`${base_url}/users/${added_member._id}/archive`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("DELETE TEAM MEMBER", () => {
    it("should return status 200 if member is archived", async () => {
      const res = await req
        .delete(`${base_url}/users/${added_member._id}`)
        .auth(token, { type: "bearer" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });
});
