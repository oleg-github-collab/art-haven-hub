package handler

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/repository"
)

var allowedMimeTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
	"image/gif":  true,
}

type UploadHandler struct {
	repo        *repository.UploadRepo
	uploadDir   string
	uploadBase  string
	maxFileSize int64
}

func NewUploadHandler(repo *repository.UploadRepo, uploadDir, uploadBase string, maxFileSizeMB int64) *UploadHandler {
	return &UploadHandler{
		repo:        repo,
		uploadDir:   uploadDir,
		uploadBase:  uploadBase,
		maxFileSize: maxFileSizeMB * 1024 * 1024,
	}
}

func (h *UploadHandler) Upload(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, h.maxFileSize)

	file, header, err := r.FormFile("file")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid file upload")
		return
	}
	defer file.Close()

	mimeType := header.Header.Get("Content-Type")
	if !allowedMimeTypes[mimeType] {
		response.Error(w, http.StatusBadRequest, "unsupported file type")
		return
	}

	ext := filepath.Ext(header.Filename)
	if ext == "" {
		switch mimeType {
		case "image/jpeg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/webp":
			ext = ".webp"
		case "image/gif":
			ext = ".gif"
		}
	}

	filename := uuid.New().String() + ext
	prefix := userID.String()[:8]
	dirPath := filepath.Join(h.uploadDir, prefix)

	if err := os.MkdirAll(dirPath, 0755); err != nil {
		response.AppError(w, fmt.Errorf("creating upload dir: %w", err))
		return
	}

	filePath := filepath.Join(dirPath, filename)
	dst, err := os.Create(filePath)
	if err != nil {
		response.AppError(w, fmt.Errorf("creating file: %w", err))
		return
	}
	defer dst.Close()

	written, err := io.Copy(dst, file)
	if err != nil {
		os.Remove(filePath)
		response.AppError(w, fmt.Errorf("writing file: %w", err))
		return
	}

	url := strings.TrimRight(h.uploadBase, "/") + "/" + prefix + "/" + filename

	upload := &model.Upload{
		UserID:       userID,
		Filename:     filename,
		OriginalName: header.Filename,
		MimeType:     mimeType,
		SizeBytes:    written,
		Path:         filePath,
		URL:          url,
	}

	if err := h.repo.Create(r.Context(), upload); err != nil {
		os.Remove(filePath)
		response.AppError(w, err)
		return
	}

	response.Created(w, upload)
}

func (h *UploadHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid ID")
		return
	}

	upload, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		response.AppError(w, apperror.NotFound("upload", id.String()))
		return
	}
	if upload.UserID != userID {
		response.AppError(w, apperror.Forbidden("not your upload"))
		return
	}

	os.Remove(upload.Path)

	if err := h.repo.Delete(r.Context(), id); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}
