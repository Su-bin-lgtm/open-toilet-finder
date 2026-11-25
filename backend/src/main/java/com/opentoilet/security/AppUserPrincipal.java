package com.opentoilet.security;

public record AppUserPrincipal(Long id, String username, String tokenHash) { }
