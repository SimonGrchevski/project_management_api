import nodemailer from "nodemailer";
import mailjetTransport from "nodemailer-mailjet-transport";


export class VerificationEmailService {
  private static transporter = nodemailer.createTransport(
      mailjetTransport({
        auth: {
          apiKey: process.env.MAILJET_API_KEY!,
          apiSecret: process.env.MAILJET_API_SECRET!,
        }
      })
  );
  
  private static getMailOptions(email:string, username:string, verificationLink: string) {
    return ( {
      from: `${process.env.MAILJET_FROM_EMAIL} | ${process.env.MAILJET_FROM_NAME}`,
      to:`${email}`,
      subject: "Verification Mail",
      html: `<!DOCTYPE html>
               <p>Hi ${username}</p>
               <p>Please verify your email by clicking the link below:</p>
               <p><a href="${verificationLink}">verification</a></p>`
    })
  }
  static send(email:string,username:string,verificationLink:string) {
    console.log("About to send the mail to ", email);
    return VerificationEmailService.transporter.sendMail(
        VerificationEmailService.getMailOptions(email,username,verificationLink)
    )
  }
};