package com.opentoilet.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    @NotBlank
    @Size(min = 3, max = 50)
    @Pattern(regexp = "[A-Za-z0-9_]+", message = "아이디는 영문, 숫자, 밑줄만 사용할 수 있습니다.")
    private String username;

    @NotBlank
    @Size(min = 10, max = 72, message = "비밀번호는 10자 이상 72자 이하여야 합니다.")
    private String password;
}
