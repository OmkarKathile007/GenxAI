package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.model.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender mailSender;
    private final String fromEmail;
    private final String appUrl;

    public NotificationService(JavaMailSender mailSender,
                               @Value("${spring.mail.username:}") String fromEmail,
                               @Value("${app.frontend.url:http://localhost:3000}") String appUrl) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
        this.appUrl = appUrl;
    }

    @Async("emailTaskExecutor")
    public void sendFirstLoginWelcomeEmail(User user) {
        if (fromEmail == null || fromEmail.isBlank()) {
            log.warn("Skipping welcome email — GMAIL_USERNAME is not configured");
            return;
        }

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            log.warn("Skipping welcome email for user {} — email is missing", user.getUsername());
            return;
        }

        String displayName = buildDisplayName(user);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject("Welcome to GenXai — your AI workspace is ready");
            helper.setText(buildWelcomeEmail(displayName, HtmlUtils.htmlEscape(appUrl)), true);

            mailSender.send(message);
            log.info("Welcome email sent to {}", user.getEmail());
        } catch (MessagingException ex) {
            log.error("Failed to send welcome email to {}", user.getEmail(), ex);
        }
    }

    private String buildDisplayName(User user) {
        if (user.getUsername() == null || user.getUsername().isBlank()) return "there";
        String username = user.getUsername();
        int at = username.indexOf('@');
        String name = at > 0 ? username.substring(0, at) : username;
        return HtmlUtils.htmlEscape(name);
    }

    private String buildWelcomeEmail(String displayName, String escapedAppUrl) {
        return """
            <!doctype html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
              <title>Welcome to GenXai</title>
            </head>
            <body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Inter,Roboto,Arial,sans-serif;">

              <!-- Preview text -->
              <div style="display:none;max-height:0;overflow:hidden;color:transparent;">
                Your GenXai AI workspace is live. Summarize, convert, write and plan — all in one place.
              </div>

              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#0a0f1e;padding:40px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0"
                           style="max-width:620px;border-radius:24px;overflow:hidden;
                                  background:linear-gradient(160deg,#0d1b3e 0%%,#0a0f1e 100%%);
                                  border:1px solid rgba(99,102,241,0.25);
                                  box-shadow:0 0 60px rgba(99,102,241,0.15),0 32px 64px rgba(0,0,0,0.5);">

                      <!-- ═══════════════ HEADER ═══════════════ -->
                      <tr>
                        <td style="padding:0;">
                          <div style="background:linear-gradient(135deg,#1e1b4b 0%%,#312e81 40%%,#1d4ed8 75%%,#0ea5e9 100%%);
                                      padding:48px 40px 40px;position:relative;overflow:hidden;">

                            <!-- Glow orbs -->
                            <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;
                                        background:radial-gradient(circle,rgba(139,92,246,0.4) 0%%,transparent 70%%);
                                        border-radius:50%%;pointer-events:none;"></div>
                            <div style="position:absolute;bottom:-30px;left:20px;width:120px;height:120px;
                                        background:radial-gradient(circle,rgba(14,165,233,0.3) 0%%,transparent 70%%);
                                        border-radius:50%%;pointer-events:none;"></div>

                            <!-- Logo row -->
                            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td>
                                  <span style="font-size:13px;font-weight:800;letter-spacing:0.2em;
                                               text-transform:uppercase;color:rgba(199,210,254,0.9);">
                                    ✦ GenXai
                                  </span>
                                </td>
                                <td align="right">
                                  <span style="display:inline-block;background:rgba(255,255,255,0.12);
                                               border:1px solid rgba(255,255,255,0.2);border-radius:999px;
                                               padding:6px 14px;font-size:11px;font-weight:700;
                                               color:#e0e7ff;letter-spacing:0.05em;">
                                    WORKSPACE ACTIVE
                                  </span>
                                </td>
                              </tr>
                            </table>

                            <!-- Headline -->
                            <h1 style="margin:32px 0 12px;font-size:36px;line-height:1.1;
                                       font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                              Hey %s,<br/>welcome aboard.
                            </h1>
                            <p style="margin:0;font-size:16px;line-height:1.7;
                                      color:rgba(199,210,254,0.85);max-width:440px;">
                              You just unlocked a full suite of AI tools — built to make you faster,
                              sharper, and way more productive.
                            </p>
                          </div>
                        </td>
                      </tr>

                      <!-- ═══════════════ CTA ═══════════════ -->
                      <tr>
                        <td style="padding:36px 40px 8px;">
                          <a href="%s"
                             style="display:inline-block;
                                    background:linear-gradient(135deg,#6366f1 0%%,#4f46e5 100%%);
                                    color:#ffffff;text-decoration:none;border-radius:14px;
                                    padding:16px 32px;font-size:15px;font-weight:800;
                                    letter-spacing:0.02em;
                                    box-shadow:0 8px 24px rgba(99,102,241,0.45);">
                            Open your dashboard →
                          </a>
                        </td>
                      </tr>

                      <!-- ═══════════════ FEATURE CARDS ═══════════════ -->
                      <tr>
                        <td style="padding:28px 40px 8px;">
                          <p style="margin:0 0 16px;font-size:12px;font-weight:700;
                                    letter-spacing:0.12em;text-transform:uppercase;
                                    color:rgba(99,102,241,0.8);">
                            WHAT'S INSIDE
                          </p>

                          <!-- Card 1 -->
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0"
                                 style="margin-bottom:12px;background:rgba(255,255,255,0.04);
                                        border:1px solid rgba(99,102,241,0.2);border-radius:16px;">
                            <tr>
                              <td style="padding:20px 22px;">
                                <table role="presentation" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td style="vertical-align:middle;padding-right:16px;">
                                      <div style="width:42px;height:42px;border-radius:12px;
                                                  background:linear-gradient(135deg,#6366f1,#8b5cf6);
                                                  text-align:center;line-height:42px;font-size:20px;">
                                        ⚡
                                      </div>
                                    </td>
                                    <td style="vertical-align:middle;">
                                      <div style="font-size:14px;font-weight:800;color:#e0e7ff;margin-bottom:4px;">
                                        Code Converter
                                      </div>
                                      <div style="font-size:13px;line-height:1.55;color:rgba(148,163,184,0.9);">
                                        Translate code between languages instantly — Python, Java, JS and more.
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <!-- Card 2 -->
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0"
                                 style="margin-bottom:12px;background:rgba(255,255,255,0.04);
                                        border:1px solid rgba(14,165,233,0.2);border-radius:16px;">
                            <tr>
                              <td style="padding:20px 22px;">
                                <table role="presentation" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td style="vertical-align:middle;padding-right:16px;">
                                      <div style="width:42px;height:42px;border-radius:12px;
                                                  background:linear-gradient(135deg,#0ea5e9,#06b6d4);
                                                  text-align:center;line-height:42px;font-size:20px;">
                                        🗺️
                                      </div>
                                    </td>
                                    <td style="vertical-align:middle;">
                                      <div style="font-size:14px;font-weight:800;color:#e0e7ff;margin-bottom:4px;">
                                        Career Roadmap Generator
                                      </div>
                                      <div style="font-size:13px;line-height:1.55;color:rgba(148,163,184,0.9);">
                                        Get a week-by-week learning path for any tech skill you want to master.
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <!-- Card 3 -->
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0"
                                 style="margin-bottom:12px;background:rgba(255,255,255,0.04);
                                        border:1px solid rgba(16,185,129,0.2);border-radius:16px;">
                            <tr>
                              <td style="padding:20px 22px;">
                                <table role="presentation" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td style="vertical-align:middle;padding-right:16px;">
                                      <div style="width:42px;height:42px;border-radius:12px;
                                                  background:linear-gradient(135deg,#10b981,#059669);
                                                  text-align:center;line-height:42px;font-size:20px;">
                                        📝
                                      </div>
                                    </td>
                                    <td style="vertical-align:middle;">
                                      <div style="font-size:14px;font-weight:800;color:#e0e7ff;margin-bottom:4px;">
                                        AI Writing Suite
                                      </div>
                                      <div style="font-size:13px;line-height:1.55;color:rgba(148,163,184,0.9);">
                                        Cold emails, cover letters, text summarizer and improver — all in one place.
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- ═══════════════ FOOTER ═══════════════ -->
                      <tr>
                        <td style="padding:24px 40px 36px;">
                          <div style="height:1px;background:rgba(99,102,241,0.15);margin-bottom:24px;"></div>
                          <p style="margin:0;font-size:12px;line-height:1.7;color:rgba(100,116,139,0.8);">
                            You received this email because you created a GenXai account for the first time.<br/>
                            <a href="%s" style="color:rgba(99,102,241,0.7);text-decoration:none;">genxai-psi.vercel.app</a>
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>

            </body>
            </html>
            """.formatted(displayName, escapedAppUrl, escapedAppUrl);
    }
}
