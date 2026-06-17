package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.entity.Contact;
import com.genaibackend.aibackend.entity.Invite;
import com.genaibackend.aibackend.repository.ContactRepository;
import com.genaibackend.aibackend.repository.InviteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Builds a unique platform-invite link for a contact and delivers it over
 * SMS/WhatsApp via {@link TwilioService}. The link points at the on-platform
 * voice consultation; each send is recorded as an {@link Invite}.
 */
@Service
public class InviteService {

    private static final Logger log = LoggerFactory.getLogger(InviteService.class);

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.invite.base-path}")
    private String invitePath;

    @Value("${twilio.default.channel}")
    private String defaultChannel;

    private final ContactService contactService;
    private final ContactRepository contactRepository;
    private final InviteRepository inviteRepository;
    private final TwilioService twilioService;

    public InviteService(ContactService contactService,
                         ContactRepository contactRepository,
                         InviteRepository inviteRepository,
                         TwilioService twilioService) {
        this.contactService = contactService;
        this.contactRepository = contactRepository;
        this.inviteRepository = inviteRepository;
        this.twilioService = twilioService;
    }

    @Transactional(readOnly = true)
    public List<Invite> listInvites(String username) {
        return inviteRepository.findByOwnerUsernameOrderByCreatedAtDesc(username);
    }

    /**
     * Return the contact's consultation link, reusing an existing invite if one
     * exists, otherwise minting a PENDING invite (without sending it). Used to
     * embed the link in follow-up messages.
     */
    @Transactional
    public String ensureInviteLink(Contact contact) {
        for (Invite existing : inviteRepository.findByContactIdOrderByCreatedAtDesc(contact.getId())) {
            if (existing.getUrl() != null && !existing.getUrl().isBlank()) {
                return existing.getUrl();
            }
        }
        String token = UUID.randomUUID().toString().replace("-", "");
        String url = buildInviteUrl(token);
        Invite invite = new Invite();
        invite.setOwner(contact.getOwner());
        invite.setContact(contact);
        invite.setToken(token);
        invite.setChannel(resolveChannel(null));
        invite.setUrl(url);
        invite.setMessage("Continue your consultation: " + url);
        invite.setStatus("PENDING");
        inviteRepository.save(invite);
        return url;
    }

    @Transactional
    public Invite sendInvite(String username, String contactId, String channelOverride) {
        Contact contact = contactService.getOwnedContact(username, contactId);
        return sendInviteToContact(contact, channelOverride);
    }

    /** Shared path used by both the manual endpoint and the call webhook. */
    @Transactional
    public Invite sendInviteToContact(Contact contact, String channelOverride) {
        String channel = resolveChannel(channelOverride);
        String token = UUID.randomUUID().toString().replace("-", "");
        String url = buildInviteUrl(token);
        String firstName = firstName(contact.getFullName());
        String message = "Hi " + firstName + ", thanks for speaking with our AI assistant. "
                + "Start your quick consultation here: " + url;

        Invite invite = new Invite();
        invite.setOwner(contact.getOwner());
        invite.setContact(contact);
        invite.setToken(token);
        invite.setChannel(channel);
        invite.setUrl(url);
        invite.setMessage(message);
        invite.setStatus("PENDING");

        try {
            String sid = twilioService.sendMessage(channel, contact.getPhone(), message);
            invite.setStatus("SENT");
            invite.setProviderMessageId(sid);
            invite.setSentAt(LocalDateTime.now());

            contact.setStatus("INVITED");
            contactRepository.save(contact);
        } catch (Exception e) {
            log.error("Invite send failed for contact {}: {}", contact.getId(), e.getMessage());
            invite.setStatus("FAILED");
            invite.setErrorMessage(truncate(e.getMessage(), 480));
        }

        return inviteRepository.save(invite);
    }

    private String resolveChannel(String override) {
        String channel = (override != null && !override.isBlank()) ? override : defaultChannel;
        if (channel == null || channel.isBlank()) channel = "SMS";
        channel = channel.trim().toUpperCase();
        return ("WHATSAPP".equals(channel)) ? "WHATSAPP" : "SMS";
    }

    private String buildInviteUrl(String token) {
        String base = frontendUrl == null ? "" : frontendUrl.replaceAll("/+$", "");
        String path = invitePath == null ? "/invite" : invitePath;
        if (!path.startsWith("/")) path = "/" + path;
        return base + path + "/" + token;
    }

    private String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "there";
        return fullName.trim().split("\\s+")[0];
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
