import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from 'src/modules/email/email.service';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const mockTransporter = {
  sendMail: jest.fn(),
};

describe('EmailService', () => {
  let service: EmailService;
  let mockCreateTransport: jest.MockedFunction<
    typeof nodemailer.createTransport
  >;

  beforeEach(async () => {
    // Set up environment variables
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'test-password';

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mockCreateTransport = nodemailer.createTransport;
    mockCreateTransport.mockReturnValue(mockTransporter as any);

    // Mock the transporter property directly
    (service as any).transporter = mockTransporter;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
  });

  describe('sendEmail', () => {
    it('should send email successfully and log success message', async () => {
      // Arrange
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const text = 'Test email content';
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      // Act
      await service.sendEmail(to, subject, text);

      // Assert
      expect(mockCreateTransport).toHaveBeenCalledWith({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"LnC News Aggregator" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
      });
      expect(logSpy).toHaveBeenCalledWith('📧 Email sent to test@example.com');
    });

    it('should handle email sending errors gracefully and log error', async () => {
      // Arrange
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const text = 'Test email content';
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();
      const errorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();
      const sendError = new Error('SMTP connection failed');

      mockTransporter.sendMail.mockRejectedValue(sendError);

      // Act
      await service.sendEmail(to, subject, text);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"LnC News Aggregator" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
      });
      expect(errorSpy).toHaveBeenCalledWith(
        '❌ Failed to send email to test@example.com',
        sendError.stack,
      );
      expect(logSpy).not.toHaveBeenCalled();
    });
  });
});
