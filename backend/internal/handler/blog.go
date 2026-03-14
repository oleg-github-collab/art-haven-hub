package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/repository"
)

type BlogHandler struct {
	repo *repository.BlogRepo
}

func NewBlogHandler(repo *repository.BlogRepo) *BlogHandler {
	return &BlogHandler{repo: repo}
}

type CreateBlogPostInput struct {
	Title       string   `json:"title" validate:"required,min=1,max=200"`
	Slug        string   `json:"slug" validate:"required,min=1,max=200"`
	Excerpt     *string  `json:"excerpt" validate:"omitempty,max=500"`
	Content     string   `json:"content" validate:"required"`
	CoverImage  *string  `json:"cover_image"`
	Tags        []string `json:"tags" validate:"omitempty,max=10"`
	IsPublished bool     `json:"is_published"`
}

func (h *BlogHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input CreateBlogPostInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	post := &model.BlogPost{
		AuthorID:    userID,
		Title:       input.Title,
		Slug:        input.Slug,
		Excerpt:     input.Excerpt,
		Content:     input.Content,
		CoverImage:  input.CoverImage,
		Tags:        model.StringArray(input.Tags),
		IsPublished: input.IsPublished,
	}

	if input.IsPublished {
		now := time.Now()
		post.PublishedAt = &now
	}

	if err := h.repo.Create(r.Context(), post); err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, post)
}

func (h *BlogHandler) GetBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	post, err := h.repo.GetBySlug(r.Context(), slug)
	if err != nil || post == nil {
		response.AppError(w, apperror.NotFound("blog post", slug))
		return
	}

	h.repo.IncrementViewCount(r.Context(), post.ID)
	response.OK(w, post)
}

func (h *BlogHandler) List(w http.ResponseWriter, r *http.Request) {
	limit, offset := parsePagination(r)

	posts, err := h.repo.List(r.Context(), limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, posts)
}

func (h *BlogHandler) Update(w http.ResponseWriter, r *http.Request) {
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

	post, err := h.repo.GetByID(r.Context(), id)
	if err != nil || post == nil {
		response.AppError(w, apperror.NotFound("blog post", id.String()))
		return
	}
	if post.AuthorID != userID {
		response.AppError(w, apperror.Forbidden("not your post"))
		return
	}

	var input CreateBlogPostInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	post.Title = input.Title
	post.Slug = input.Slug
	post.Excerpt = input.Excerpt
	post.Content = input.Content
	post.CoverImage = input.CoverImage
	post.Tags = model.StringArray(input.Tags)
	post.IsPublished = input.IsPublished
	if input.IsPublished && post.PublishedAt == nil {
		now := time.Now()
		post.PublishedAt = &now
	}

	if err := h.repo.Update(r.Context(), post); err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, post)
}

func (h *BlogHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

	post, err := h.repo.GetByID(r.Context(), id)
	if err != nil || post == nil {
		response.AppError(w, apperror.NotFound("blog post", id.String()))
		return
	}
	if post.AuthorID != userID {
		response.AppError(w, apperror.Forbidden("not your post"))
		return
	}

	if err := h.repo.Delete(r.Context(), id); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}
