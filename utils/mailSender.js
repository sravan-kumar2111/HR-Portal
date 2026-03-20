const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS, // App password
      },
    });

    let info = await transporter.sendMail({
      from: '"Manyam Consultancy & Technology Services Pvt Ltd" <no-reply@hrportal.com>',
      to: email,
      subject: title,
      html: body,
    });

    return info;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = mailSender;