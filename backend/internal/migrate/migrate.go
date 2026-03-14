package migrate

import (
	"errors"
	"fmt"
	"log/slog"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// Run applies all pending migrations from the given directory to the database.
func Run(databaseURL, migrationsDir string) error {
	m, err := migrate.New(
		fmt.Sprintf("file://%s", migrationsDir),
		databaseURL,
	)
	if err != nil {
		return fmt.Errorf("creating migrator: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			slog.Info("migrations: no new migrations to apply")
			return nil
		}
		return fmt.Errorf("running migrations: %w", err)
	}

	version, dirty, _ := m.Version()
	slog.Info("migrations applied successfully", "version", version, "dirty", dirty)
	return nil
}
