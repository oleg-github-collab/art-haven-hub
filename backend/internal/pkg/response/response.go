package response

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/art-haven-hub/backend/internal/pkg/apperror"
)

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	NextCursor string      `json:"next_cursor,omitempty"`
	Total      int64       `json:"total,omitempty"`
	Page       int         `json:"page,omitempty"`
	PerPage    int         `json:"per_page,omitempty"`
	TotalPages int         `json:"total_pages,omitempty"`
}

func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			slog.Error("failed to encode response", "error", err)
		}
	}
}

func OK(w http.ResponseWriter, data interface{}) {
	JSON(w, http.StatusOK, map[string]interface{}{"data": data})
}

func Created(w http.ResponseWriter, data interface{}) {
	JSON(w, http.StatusCreated, map[string]interface{}{"data": data})
}

func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

func Paginated(w http.ResponseWriter, data interface{}, nextCursor string, total int64) {
	JSON(w, http.StatusOK, PaginatedResponse{
		Data:       data,
		NextCursor: nextCursor,
		Total:      total,
	})
}

func PaginatedOffset(w http.ResponseWriter, data interface{}, total int64, page, perPage int) {
	totalPages := int(total) / perPage
	if int(total)%perPage > 0 {
		totalPages++
	}
	JSON(w, http.StatusOK, PaginatedResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: totalPages,
	})
}

// Error writes an error response with a given HTTP status code and message.
func Error(w http.ResponseWriter, status int, message string) {
	JSON(w, status, map[string]interface{}{
		"error":   http.StatusText(status),
		"message": message,
		"status":  status,
	})
}

// AppError writes an error response, mapping AppError to proper status codes.
func AppError(w http.ResponseWriter, err error) {
	var appErr *apperror.AppError
	if errors.As(err, &appErr) {
		JSON(w, appErr.Status, appErr)
		return
	}

	slog.Error("unhandled error", "error", err)
	JSON(w, http.StatusInternalServerError, map[string]interface{}{
		"error":   "Internal Server Error",
		"message": "internal server error",
		"status":  http.StatusInternalServerError,
	})
}
