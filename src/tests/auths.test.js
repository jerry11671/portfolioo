const request = require("supertest");

const { userModel } = require("../models/index");
const app = require("../../app");
const { createUser } = require("./helpers/index");

const req = request(app);

const base_url = "/api/v1/user";

describe("AUTHS", () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await createUser();
  });

  afterEach(() => {
    userModel.deleteMany({});
  });

  describe("REGISTER", () => {
    it("should return status 400 if email is invalid", async () => {
      const res = await req.post(`${base_url}/auths/register`).send({
        first_name: "John",
        last_name: "Doe",
        id: "john.doe",
        password: "password",
      });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if user is registered", async () => {
      const res = await req.post(`${base_url}/auths/register`).send({
        first_name: "John",
        last_name: "Doe",
        id: "john.doe@yopmail.com",
        password: "password",
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("VERIFY EMAIL", () => {
    it("should return status 200 if OTP is resent", async () => {
      const res = await req
        .post(`${base_url}/auths/register/resend-code`)
        .send({
          id: "john.doe@yopmail.com",
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 498 if OTP is invalid", async () => {
      const res = await req
        .post(`${base_url}/auths/register/validate-code`)
        .send({
          id: "john.doe@yopmail.com",
          verification_code: "2234",
        });

      expect(res.status).toBe(498);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if email is verified", async () => {
      const res = await req
        .post(`${base_url}/auths/register/validate-code`)
        .send({
          id: "john.doe@yopmail.com",
          verification_code: "1234",
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("FORGOT PASSWORD", () => {
    it("should return status 404 if user is yet to register", async () => {
      const res = await req
        .post(`${base_url}/auths/forgot-password`)
        .send({ id: "example@email.com" });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if OTP is sent to user mail", async () => {
      const res = await req
        .post(`${base_url}/auths/forgot-password`)
        .send({ id: "john.doe@yopmail.com" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("VALIDATE RESET PASSWORD OTP", () => {
    it("should return status 400 if otp is wrong", async () => {
      const res = await req
        .post(`${base_url}/auths/forgot-password/validate-code`)
        .send({
          id: "john.doe@yopmail.com",
          verification_code: "12345",
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 400 if otp is expired", async () => {
      user = await userModel
        .findOne({ email: "john.doe@yopmail.com" })
        .select({ "reset_password.token": 1, "reset_password.expires_in": 1 });

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
        .post(`${base_url}/auths/forgot-password/validate-code`)
        .send({
          id: "john.doe@yopmail.com",
          verification_code: user.reset_password.token,
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if otp is valid", async () => {
      user = await userModel
        .findOne({ email: "john.doe@yopmail.com" })
        .select({ "reset_password.token": 1, "reset_password.expires_in": 1 });

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
          select: "+reset_password.token +reset_password.expires_in",
        }
      );

      const res = await req
        .post(`${base_url}/auths/forgot-password/validate-code`)
        .send({
          id: "john.doe@yopmail.com",

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
      user = await userModel
        .findOne({ email: "john.doe@yopmail.com" })
        .select({ "reset_password.token": 1, email: 1 });

      const res = await req.post(`${base_url}/auths/reset-password`).send({
        id: user.email,
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
      user = await userModel
        .findOne({ email: "john.doe@yopmail.com" })
        .select({ "reset_password.token": 1, email: 1 });

      const res = await req.post(`${base_url}/auths/reset-password`).send({
        id: "john.doe@yopmail.com",
        verification_code: user.reset_password.token,
        new_password: "password123$$",
        confirm_password: "password123$$",
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });

  describe("LOGIN", () => {
    it("should return status 400 if email is invalid", async () => {
      const res = await req
        .post(`${base_url}/auths/login?app`)
        .send({ email: "error.com", password: "password" });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 400 if email or password is incorrect", async () => {
      const res = await req
        .post(`${base_url}/auths/login`)
        .send({ email: user.email, password: "password123" });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

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

  describe("CHANGE PASSWORD", () => {
    it("should return status 401 if users is not logged in", async () => {
      const res = await req.patch(`${base_url}/auths/change-password`).send({
        new_password: "password1234",
        confirm_password: "password1234",
      });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });

    it("should return status 200 if password is changed", async () => {
      const res = await req
        .patch(`${base_url}/auths/change-password`)
        .auth(token, { type: "bearer" })
        .send({
          current_password: "password",
          new_password: "password1234$",
          confirm_password: "password1234$",
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status_code: res.status,
        message: expect.any(String),
      });
    });
  });
});
