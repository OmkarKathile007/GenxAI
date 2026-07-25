package com.genaibackend.aibackend.dto;

import java.io.Serializable;

public class EmailEvent implements Serializable {
    private String toEmail;
    private String username;
    private String type; // e.g., "WELCOME_EMAIL"

    public EmailEvent() {
    }

    public EmailEvent(String toEmail, String username, String type) {
        this.toEmail = toEmail;
        this.username = username;
        this.type = type;
    }

    public String getToEmail() {
        return toEmail;
    }

    public void setToEmail(String toEmail) {
        this.toEmail = toEmail;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
