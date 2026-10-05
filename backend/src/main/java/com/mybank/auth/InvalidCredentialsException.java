package com.mybank.auth;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() { super("E-mail ou senha inválidos"); }
}
