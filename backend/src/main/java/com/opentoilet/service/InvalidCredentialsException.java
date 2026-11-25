package com.opentoilet.service;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() { super("아이디 또는 비밀번호를 확인해 주세요."); }
}
