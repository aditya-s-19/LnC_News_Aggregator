import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"LnC News Aggregator" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
      });
      this.logger.log(`📧 Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}`, error.stack);
    }
  }
}
