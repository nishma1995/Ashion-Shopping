const mongo = require("mongoose");
const dotenv = require("dotenv");
const mailSender=require('../controller/sendEmail')
dotenv.config({ path: "../configaration" });
const db = process.env.DB_STRING;

const OtpSchema = new mongo.Schema({
  email: {
    type: String,
  },
  otp: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 120
  }
});

async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await mailSender(
      email,
      "Verification Email",
      `<h1>Please confirm your OTP</h1>
       <p>Here is your OTP code: ${otp}</p>`
    );
  } catch (error) {
    console.log("Error occurred while sending email: ", error);
    throw error;
  }
}
OtpSchema.pre("save", async function (next) {
  // Only send an email when a new document is created
  if (this.isNew) {
    await sendVerificationEmail(this.email, this.otp);
  }
  next();
});

const OTP = mongo.model("OTP",OtpSchema);

module.exports = OTP;
