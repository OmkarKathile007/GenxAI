package com.genaibackend.aibackend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;



public class AuthResponse {
    private String token;

    /** Goes to the browser as an httpOnly cookie, so it must stay out of the JSON body. */
    @JsonIgnore
    private final String refreshToken;

    public AuthResponse(String token, String refreshToken) {
        this.token = token;
        this.refreshToken = refreshToken;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getRefreshToken() { return refreshToken; }
}