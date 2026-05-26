import nodemailer from "nodemailer";
import {NEWS_SUMMARY_EMAIL_TEMPLATE, WELCOME_EMAIL_TEMPLATE} from "@/lib/nodemailer/templates";


// This mail transporter is the single place used to send all app emails.
export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

// This fills the welcome email template and sends it to a new user.
export const sendWelcomeEmail = async ({email,name,intro}: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}',name)
        .replace('{{intro}}',intro);

    const mailOptions = {
        from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: `Welcome to Signalist - your stock market toolkit is ready!`,
        text: 'Thanks for joining Signalist',
        html: htmlTemplate,
    }
    await transporter.sendMail(mailOptions);
}

// This fills the daily news email template and sends it to one user.
export const sendNewsSummaryEmail = async (
    { email,date,newsContent}: {email: string,date: string,newsContent: string}
    ): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}',date)
        .replace('{{newsContent}}',newsContent);
    const mailOptions = {
        from: `"Signalist News" <Signalist.Stock18@gmail.com>`,
        to: email,
        subject: `Market News Summary today - ${date}`,
        text: `Today's market news summary from Signalist` ,
        html: htmlTemplate,
    };
    await transporter.sendMail(mailOptions);
}
