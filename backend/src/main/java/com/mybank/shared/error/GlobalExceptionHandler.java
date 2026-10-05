package com.mybank.shared.error;

import com.mybank.auth.InvalidCredentialsException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private final ApiProblems problems;
    public GlobalExceptionHandler(ApiProblems problems) { this.problems = problems; }

    @ExceptionHandler(InvalidCredentialsException.class)
    ProblemDetail invalidCredentials(HttpServletRequest request) {
        return problems.create(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos", request.getRequestURI());
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail validation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        var problem = problems.create(400, "VALIDATION_FAILED", "Dados inválidos.", request.getRequestURI());
        problem.setProperty("errors", exception.getBindingResult().getFieldErrors().stream()
                .map(e -> Map.of("field", e.getField(), "message", e.getDefaultMessage())).toList());
        return problem;
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ProblemDetail unreadable(HttpServletRequest request) {
        return problems.create(400, "INVALID_REQUEST", "Requisição inválida.", request.getRequestURI());
    }
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ProblemDetail unsupported(HttpServletRequest request) {
        return problems.create(415, "UNSUPPORTED_MEDIA_TYPE", "Tipo de conteúdo não suportado.", request.getRequestURI());
    }
    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    ProblemDetail missing(HttpServletRequest request) {
        return problems.create(404, "NOT_FOUND", "Recurso não encontrado.", request.getRequestURI());
    }
    @ExceptionHandler(Exception.class)
    ProblemDetail unexpected(Exception exception, HttpServletRequest request) {
        // Não incluir mensagens de exceções, que podem conter o corpo de autenticação.
        logger.error("Falha inesperada na API: {}", exception.getClass().getName());
        return problems.create(500, "INTERNAL_ERROR", "Não foi possível concluir a solicitação.", request.getRequestURI());
    }
}
