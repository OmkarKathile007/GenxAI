package com.genaibackend.aibackend.dto;

/** A single contact to create, manually or from one CSV/Excel row. */
public class ContactRequest {

    private String fullName;
    private String phone;
    private String email;
    private String company;
    private String source;
    private String segment;
    private String notes;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getSegment() { return segment; }
    public void setSegment(String segment) { this.segment = segment; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
