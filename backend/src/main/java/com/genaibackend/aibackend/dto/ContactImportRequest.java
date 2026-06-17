package com.genaibackend.aibackend.dto;

import java.util.ArrayList;
import java.util.List;

/** Bulk import payload: rows parsed from CSV/Excel on the client. */
public class ContactImportRequest {

    private List<ContactRequest> contacts = new ArrayList<>();
    private String source;

    public List<ContactRequest> getContacts() { return contacts; }
    public void setContacts(List<ContactRequest> contacts) { this.contacts = contacts; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
