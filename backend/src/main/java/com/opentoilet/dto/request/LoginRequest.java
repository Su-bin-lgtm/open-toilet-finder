package com.opentoilet.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    @NotBlank @Size(max = 50)
    private String username;
    @NotBlank @Size(max = 72)
    private String password;
}
