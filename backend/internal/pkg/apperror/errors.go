package apperror

import (
	"fmt"
	"net/http"
)

type AppError struct {
	Code    string                 `json:"code"`
	Message string                 `json:"message"`
	Details map[string]interface{} `json:"details,omitempty"`
	Status  int                    `json:"-"`
}

func (e *AppError) Error() string {
	return e.Message
}

func NotFound(entity, id string) *AppError {
	return &AppError{
		Code:    "NOT_FOUND",
		Message: fmt.Sprintf("%s not found: %s", entity, id),
		Status:  http.StatusNotFound,
	}
}

func Unauthorized(msg string) *AppError {
	return &AppError{
		Code:    "UNAUTHORIZED",
		Message: msg,
		Status:  http.StatusUnauthorized,
	}
}

func Forbidden(msg string) *AppError {
	return &AppError{
		Code:    "FORBIDDEN",
		Message: msg,
		Status:  http.StatusForbidden,
	}
}

func Validation(msg string) *AppError {
	return &AppError{
		Code:    "VALIDATION_ERROR",
		Message: msg,
		Status:  http.StatusUnprocessableEntity,
	}
}

func ValidationWithDetails(msg string, details map[string]interface{}) *AppError {
	return &AppError{
		Code:    "VALIDATION_ERROR",
		Message: msg,
		Details: details,
		Status:  http.StatusUnprocessableEntity,
	}
}

func BadRequest(msg string) *AppError {
	return &AppError{
		Code:    "BAD_REQUEST",
		Message: msg,
		Status:  http.StatusBadRequest,
	}
}

func Conflict(msg string) *AppError {
	return &AppError{
		Code:    "CONFLICT",
		Message: msg,
		Status:  http.StatusConflict,
	}
}

func Internal(msg string) *AppError {
	return &AppError{
		Code:    "INTERNAL_ERROR",
		Message: msg,
		Status:  http.StatusInternalServerError,
	}
}

func Internalf(format string, args ...interface{}) *AppError {
	return Internal(fmt.Sprintf(format, args...))
}

func TooManyRequests(msg string) *AppError {
	return &AppError{
		Code:    "RATE_LIMIT_EXCEEDED",
		Message: msg,
		Status:  http.StatusTooManyRequests,
	}
}
