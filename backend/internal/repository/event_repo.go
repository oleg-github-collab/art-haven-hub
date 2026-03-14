package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type EventRepo struct {
	db *sqlx.DB
}

func NewEventRepo(db *sqlx.DB) *EventRepo {
	return &EventRepo{db: db}
}

func (r *EventRepo) Create(ctx context.Context, e *model.Event) error {
	query := `INSERT INTO events (organizer_id, title, description, event_type, location, address,
		city, country, is_online, online_url, cover_image, images, starts_at, ends_at,
		price_cents, currency, max_attendees, tags)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRowxContext(ctx, query,
		e.OrganizerID, e.Title, e.Description, e.EventType, e.Location, e.Address,
		e.City, e.Country, e.IsOnline, e.OnlineURL, e.CoverImage, e.Images,
		e.StartsAt, e.EndsAt, e.PriceCents, e.Currency, e.MaxAttendees, e.Tags,
	).Scan(&e.ID, &e.CreatedAt, &e.UpdatedAt)
}

func (r *EventRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.Event, error) {
	var e model.Event
	err := r.db.GetContext(ctx, &e, `SELECT * FROM events WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &e, err
}

func (r *EventRepo) List(ctx context.Context, limit, offset int) ([]model.Event, error) {
	var events []model.Event
	err := r.db.SelectContext(ctx, &events,
		`SELECT * FROM events WHERE starts_at > NOW() ORDER BY starts_at LIMIT $1 OFFSET $2`,
		limit, offset)
	if events == nil {
		events = []model.Event{}
	}
	return events, err
}

func (r *EventRepo) Update(ctx context.Context, e *model.Event) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE events SET title=$2, description=$3, event_type=$4, location=$5, address=$6,
		 city=$7, country=$8, is_online=$9, online_url=$10, cover_image=$11, images=$12,
		 starts_at=$13, ends_at=$14, price_cents=$15, currency=$16, max_attendees=$17, tags=$18
		 WHERE id = $1`,
		e.ID, e.Title, e.Description, e.EventType, e.Location, e.Address,
		e.City, e.Country, e.IsOnline, e.OnlineURL, e.CoverImage, e.Images,
		e.StartsAt, e.EndsAt, e.PriceCents, e.Currency, e.MaxAttendees, e.Tags)
	return err
}

func (r *EventRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM events WHERE id = $1`, id)
	return err
}

func (r *EventRepo) Attend(ctx context.Context, eventID, userID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		eventID, userID)
	if err == nil {
		r.db.ExecContext(ctx, `UPDATE events SET attendee_count = attendee_count + 1 WHERE id = $1`, eventID)
	}
	return err
}

func (r *EventRepo) Unattend(ctx context.Context, eventID, userID uuid.UUID) error {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2`, eventID, userID)
	if err != nil {
		return err
	}
	if rows, _ := result.RowsAffected(); rows > 0 {
		r.db.ExecContext(ctx, `UPDATE events SET attendee_count = GREATEST(attendee_count - 1, 0) WHERE id = $1`, eventID)
	}
	return nil
}

func (r *EventRepo) IsAttending(ctx context.Context, eventID, userID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.GetContext(ctx, &exists,
		`SELECT EXISTS(SELECT 1 FROM event_attendees WHERE event_id = $1 AND user_id = $2)`,
		eventID, userID)
	return exists, err
}
