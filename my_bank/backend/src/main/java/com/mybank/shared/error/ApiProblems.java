package com.mybank.shared.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

@Component
public class ApiProblems {
    private final JsonMapper mapper;
    public ApiProblems(JsonMapper mapper) { this.mapper = mapper; }

    public ProblemDetail create(int status, String code, String detail, String path) {
        var problem = ProblemDetail.forStatusAndDetail(org.springframework.http.HttpStatusCode.valueOf(status), detail);
        problem.setType(URI.create("about:blank"));
        problem.setTitle(switch (status) {
            case 400 -> code.equals("VALIDATION_FAILED") ? "Dados inválidos" : "Requisição inválida";
            case 401 -> "Não autenticado";
            case 403 -> "Acesso negado";
            case 404 -> "Recurso não encontrado";
            case 415 -> "Tipo de conteúdo não suportado";
            default -> "Erro interno";
        });
        problem.setInstance(URI.create(path));
        problem.setProperty("code", code);
        return problem;
    }

    public void write(HttpServletRequest request, HttpServletResponse response,
                      int status, String code, String detail) throws IOException {
        response.setStatus(status);
        response.setContentType("application/problem+json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-store");
        response.getWriter().write(mapper.writeValueAsString(create(status, code, detail, request.getRequestURI())));
    }
}
