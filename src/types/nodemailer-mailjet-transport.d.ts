declare module "nodemailer-mailjet-transport" {
    import { TransportOptions } from "nodemailer";

    export interface MailjetTransportAuth {
        apiKey: string;
        apiSecret: string;
    }

    export interface MailjetTransportOptions extends TransportOptions {
        auth: MailjetTransportAuth;
    }

    export default function mailjetTransport(options: MailjetTransportOptions): any;
}
