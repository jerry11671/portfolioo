const SibApiV3Sdk = require("sib-api-v3-sdk");

const nodemailer = require("nodemailer");
const logger = require("../logger");
const sendinblue_api_key = process.env.SENDINBLUE_API_KEY;
const smtp_sender_name = process.env.SMTP_SENDER_NAME;
const smtp_from = process.env.SMTP_FROM;
const smtp_host = process.env.SMTP_HOST;
const smtp_port = process.env.SMTP_PORT;
const smtp_username = process.env.SMTP_USERNAME;
const smtp_password = process.env.SMTP_PASSWORD;
const environment = process.env.NODE_ENV;

let sendMail;

if (environment == "production") {
  sendMail = sendMail = async (options) => {
    // create transpoter
    const transpot = nodemailer.createTransport({
      host: smtp_host,
      port: smtp_port,
      auth: {
        user: smtp_username,
        pass: smtp_password,
      },
    });

    const mailOptions = {
      from: `${smtp_sender_name} ${smtp_from}`,
      to: options.email,
      subject: options.subject,
      html: options.message,
      attachments: options.attachments
        ? [
            {
              filename: options.attachments[0].filename,
              content: options.attachments[0].file,
              encoding: "base64",
            },
          ]
        : [],
      cc: options.cc ? options.cc.map((recipient) => recipient.email) : [],
    };

    // send mail
    await transpot.sendMail(mailOptions);
  };
} else {
  SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey =
    sendinblue_api_key;

  sendMail = async (options) => {
    try {
      const mailOptions = {
        subject: options.subject,
        sender: { email: smtp_from, name: smtp_sender_name },
        to: [{ email: options.email }],
        htmlContent: options.message,
        attachment: options.attachments
          ? [
              {
                content: options.attachments[0].file,
                name: options.attachments[0].filename,
                type: "application/pdf",
              },
            ]
          : null,
        cc: options.cc
          ? options.cc.map((recipient) => ({
              email: recipient.email,
            }))
          : null,
      };

      await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(
        mailOptions
      );
    } catch (error) {
      logger.error(`Error sending email: ${error.message}`);
    }
  };
}

module.exports = sendMail;
