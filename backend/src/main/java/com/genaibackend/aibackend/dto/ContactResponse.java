package com.genaibackend.aibackend.dto;

import com.genaibackend.aibackend.entity.Contact;

import java.time.LocalDateTime;

public class ContactResponse {

    private String id;
    private String fullName;
    private String phone;
    private String email;
    private String company;
    private String source;
    private String segment;
    private String status;
    private Integer score;
    private String notes;
    private LocalDateTime lastCalledAt;
    private LocalDateTime createdAt;

    public static ContactResponse from(Contact c) {
        ContactResponse r = new ContactResponse();
        r.id = c.getId();
        r.fullName = c.getFullName();
        r.phone = c.getPhone();
        r.email = c.getEmail();
        r.company = c.getCompany();
        r.source = c.getSource();
        r.segment = c.getSegment();
        r.status = c.getStatus();
        r.score = c.getScore();
        r.notes = c.getNotes();
        r.lastCalledAt = c.getLastCalledAt();
        r.createdAt = c.getCreatedAt();
        return r;
    }

    public String getId() { return id; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getCompany() { return company; }
    public String getSource() { return source; }
    public String getSegment() { return segment; }
    public String getStatus() { return status; }
    public Integer getScore() { return score; }
    public String getNotes() { return notes; }
    public LocalDateTime getLastCalledAt() { return lastCalledAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
