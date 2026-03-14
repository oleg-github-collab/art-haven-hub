package service

import (
	"context"
	"fmt"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/google/uuid"
)

type FeedService struct {
	feedRepo *repository.FeedRepo
}

func NewFeedService(feedRepo *repository.FeedRepo) *FeedService {
	return &FeedService{feedRepo: feedRepo}
}

type CreatePostInput struct {
	Content string   `json:"content" validate:"required,min=1,max=5000"`
	Images  []string `json:"images"`
	Tags    []string `json:"tags" validate:"omitempty,max=10,dive,max=50"`
}

type UpdatePostInput struct {
	Content string   `json:"content" validate:"required,min=1,max=5000"`
	Images  []string `json:"images"`
	Tags    []string `json:"tags" validate:"omitempty,max=10,dive,max=50"`
}

type CreateCommentInput struct {
	Content string `json:"content" validate:"required,min=1,max=2000"`
}

func (s *FeedService) CreatePost(ctx context.Context, authorID uuid.UUID, input *CreatePostInput) (*model.FeedPost, error) {
	post := &model.FeedPost{
		AuthorID: authorID,
		Content:  input.Content,
		Images:   model.StringArray(input.Images),
		Tags:     model.StringArray(input.Tags),
	}

	if err := s.feedRepo.CreatePost(ctx, post); err != nil {
		return nil, fmt.Errorf("creating post: %w", err)
	}

	author, _ := s.feedRepo.GetAuthor(ctx, authorID)
	post.Author = author

	return post, nil
}

func (s *FeedService) GetPost(ctx context.Context, id uuid.UUID, viewerID *uuid.UUID) (*model.FeedPost, error) {
	post, err := s.feedRepo.GetPostByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting post: %w", err)
	}
	if post == nil {
		return nil, apperror.NotFound("post", id.String())
	}

	author, _ := s.feedRepo.GetAuthor(ctx, post.AuthorID)
	post.Author = author

	if viewerID != nil {
		post.IsLiked, _ = s.feedRepo.IsPostLiked(ctx, *viewerID, id)
		post.IsReposted, _ = s.feedRepo.IsPostReposted(ctx, *viewerID, id)
		post.IsBookmarked, _ = s.feedRepo.IsPostBookmarked(ctx, *viewerID, id)
	}

	return post, nil
}

func (s *FeedService) UpdatePost(ctx context.Context, id, authorID uuid.UUID, input *UpdatePostInput) (*model.FeedPost, error) {
	post, err := s.feedRepo.GetPostByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting post: %w", err)
	}
	if post == nil {
		return nil, apperror.NotFound("post", id.String())
	}
	if post.AuthorID != authorID {
		return nil, apperror.Forbidden("you can only edit your own posts")
	}

	if err := s.feedRepo.UpdatePost(ctx, id, input.Content, model.StringArray(input.Images), model.StringArray(input.Tags)); err != nil {
		return nil, fmt.Errorf("updating post: %w", err)
	}

	return s.feedRepo.GetPostByID(ctx, id)
}

func (s *FeedService) DeletePost(ctx context.Context, id, authorID uuid.UUID) error {
	post, err := s.feedRepo.GetPostByID(ctx, id)
	if err != nil {
		return fmt.Errorf("getting post: %w", err)
	}
	if post == nil {
		return apperror.NotFound("post", id.String())
	}
	if post.AuthorID != authorID {
		return apperror.Forbidden("you can only delete your own posts")
	}
	return s.feedRepo.DeletePost(ctx, id)
}

func (s *FeedService) ListPosts(ctx context.Context, sort string, limit, offset int, viewerID *uuid.UUID) ([]model.FeedPost, error) {
	var posts []model.FeedPost
	var err error

	if viewerID != nil && sort == "following" {
		posts, err = s.feedRepo.ListFollowingPosts(ctx, *viewerID, limit, offset)
	} else {
		posts, err = s.feedRepo.ListPosts(ctx, sort, limit, offset)
	}
	if err != nil {
		return nil, fmt.Errorf("listing posts: %w", err)
	}

	for i := range posts {
		author, _ := s.feedRepo.GetAuthor(ctx, posts[i].AuthorID)
		posts[i].Author = author
		if viewerID != nil {
			posts[i].IsLiked, _ = s.feedRepo.IsPostLiked(ctx, *viewerID, posts[i].ID)
			posts[i].IsReposted, _ = s.feedRepo.IsPostReposted(ctx, *viewerID, posts[i].ID)
			posts[i].IsBookmarked, _ = s.feedRepo.IsPostBookmarked(ctx, *viewerID, posts[i].ID)
		}
	}

	return posts, nil
}

// --- Comments ---

func (s *FeedService) CreateComment(ctx context.Context, postID, authorID uuid.UUID, input *CreateCommentInput) (*model.FeedComment, error) {
	comment := &model.FeedComment{
		PostID:   postID,
		AuthorID: authorID,
		Content:  input.Content,
	}

	if err := s.feedRepo.CreateComment(ctx, comment); err != nil {
		return nil, fmt.Errorf("creating comment: %w", err)
	}

	author, _ := s.feedRepo.GetAuthor(ctx, authorID)
	comment.Author = author

	return comment, nil
}

func (s *FeedService) DeleteComment(ctx context.Context, commentID, userID uuid.UUID) error {
	comment, err := s.feedRepo.GetCommentByID(ctx, commentID)
	if err != nil {
		return fmt.Errorf("getting comment: %w", err)
	}
	if comment == nil {
		return apperror.NotFound("comment", commentID.String())
	}
	if comment.AuthorID != userID {
		return apperror.Forbidden("you can only delete your own comments")
	}
	return s.feedRepo.DeleteComment(ctx, commentID, comment.PostID)
}

func (s *FeedService) GetComments(ctx context.Context, postID uuid.UUID, limit, offset int) ([]model.FeedComment, error) {
	comments, err := s.feedRepo.GetComments(ctx, postID, limit, offset)
	if err != nil {
		return nil, err
	}
	for i := range comments {
		author, _ := s.feedRepo.GetAuthor(ctx, comments[i].AuthorID)
		comments[i].Author = author
	}
	return comments, nil
}

// --- Actions ---

func (s *FeedService) LikePost(ctx context.Context, userID, postID uuid.UUID) error {
	return s.feedRepo.LikePost(ctx, userID, postID)
}

func (s *FeedService) UnlikePost(ctx context.Context, userID, postID uuid.UUID) error {
	return s.feedRepo.UnlikePost(ctx, userID, postID)
}

func (s *FeedService) RepostPost(ctx context.Context, userID, postID uuid.UUID) error {
	return s.feedRepo.RepostPost(ctx, userID, postID)
}

func (s *FeedService) UnrepostPost(ctx context.Context, userID, postID uuid.UUID) error {
	return s.feedRepo.UnrepostPost(ctx, userID, postID)
}

func (s *FeedService) BookmarkPost(ctx context.Context, userID, postID uuid.UUID) error {
	return s.feedRepo.BookmarkPost(ctx, userID, postID)
}

func (s *FeedService) UnbookmarkPost(ctx context.Context, userID, postID uuid.UUID) error {
	return s.feedRepo.UnbookmarkPost(ctx, userID, postID)
}

func (s *FeedService) GetBookmarks(ctx context.Context, userID uuid.UUID, limit, offset int) ([]model.FeedPost, error) {
	return s.feedRepo.GetBookmarks(ctx, userID, limit, offset)
}

func (s *FeedService) LikeComment(ctx context.Context, userID, commentID uuid.UUID) error {
	return s.feedRepo.LikeComment(ctx, userID, commentID)
}
