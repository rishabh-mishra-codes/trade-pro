package com.tradepro.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@tradepro.local}")
    private String from;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordReset(String to, String token) {
        String resetLink = frontendUrl + "/forgot-password?token=" + token;
        String body = "You requested a password reset for your TradePro account.\n\n"
                + "Use this token to reset your password: " + token + "\n\n"
                + "Or open this link: " + resetLink + "\n\n"
                + "This token expires in 1 hour. If you didn't request this, ignore this email.";

        if (!mailEnabled) {
            // SMTP not configured: log so dev flow still works.
            log.info("[EMAIL DISABLED] Password reset for {} -> token: {}", to, token);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject("Reset your TradePro password");
            message.setText(body);
            mailSender.send(message);
            log.info("Password reset email sent to {}", to);
        } catch (Exception ex) {
            log.error("Failed to send password reset email to {}: {}", to, ex.getMessage());
        }
    }
}
