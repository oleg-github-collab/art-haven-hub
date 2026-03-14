package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/service"
)

type FeedHandler struct {
	feedService *service.FeedService
}

func NewFeedHandler(feedService *service.FeedService) *FeedHandler {
	return &FeedHandler{feedService: feedService}
}

func (h *FeedHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input service.CreatePostInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	post, err := h.feedService.CreatePost(r.Context(), userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, post)
}

func (h *FeedHandler) GetPost(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}

	var viewerID *uuid.UUID
	if uid, ok := middleware.GetUserID(r.Context()); ok {
		viewerID = &uid
	}

	post, err := h.feedService.GetPost(r.Context(), id, viewerID)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, post)
}

func (h *FeedHandler) UpdatePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}

	var input service.UpdatePostInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	post, err := h.feedService.UpdatePost(r.Context(), id, userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, post)
}

func (h *FeedHandler) DeletePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}

	if err := h.feedService.DeletePost(r.Context(), id, userID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *FeedHandler) ListPosts(w http.ResponseWriter, r *http.Request) {
	sort := r.URL.Query().Get("sort")
	limit, offset := parsePagination(r)

	var viewerID *uuid.UUID
	if uid, ok := middleware.GetUserID(r.Context()); ok {
		viewerID = &uid
	}

	posts, err := h.feedService.ListPosts(r.Context(), sort, limit, offset, viewerID)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, posts)
}

func (h *FeedHandler) GetComments(w http.ResponseWriter, r *http.Request) {
	postID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}

	limit, offset := parsePagination(r)
	comments, err := h.feedService.GetComments(r.Context(), postID, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, comments)
}

func (h *FeedHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	postID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}

	var input service.CreateCommentInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	comment, err := h.feedService.CreateComment(r.Context(), postID, userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, comment)
}

func (h *FeedHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	commentID, err := uuid.Parse(chi.URLParam(r, "commentId"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid comment ID")
		return
	}

	if err := h.feedService.DeleteComment(r.Context(), commentID, userID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *FeedHandler) LikePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	postID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}

	if err := h.feedService.LikePost(r.Context(), userID, postID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *FeedHandler) UnlikePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	postID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}

	if err := h.feedService.UnlikePost(r.Context(), userID, postID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *FeedHandler) RepostPost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	postID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}

	if err := h.feedService.RepostPost(r.Context(), userID, postID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *FeedHandler) UnrepostPost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	postID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}

	if err := h.feedService.UnrepostPost(r.Context(), userID, postID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *FeedHandler) BookmarkPost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	postID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}

	if err := h.feedService.BookmarkPost(r.Context(), userID, postID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *FeedHandler) UnbookmarkPost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	postID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}

	if err := h.feedService.UnbookmarkPost(r.Context(), userID, postID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *FeedHandler) GetBookmarks(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	limit, offset := parsePagination(r)
	posts, err := h.feedService.GetBookmarks(r.Context(), userID, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, posts)
}

func (h *FeedHandler) LikeComment(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	commentID, err := uuid.Parse(chi.URLParam(r, "commentId"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid comment ID")
		return
	}

	if err := h.feedService.LikeComment(r.Context(), userID, commentID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}
