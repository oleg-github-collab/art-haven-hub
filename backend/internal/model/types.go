package model

import (
	"database/sql/driver"
	"fmt"
	"strings"
)

// StringArray is a custom type for PostgreSQL TEXT[] arrays that works with sqlx.
type StringArray []string

func (a *StringArray) Scan(src interface{}) error {
	if src == nil {
		*a = StringArray{}
		return nil
	}

	var s string
	switch v := src.(type) {
	case []byte:
		s = string(v)
	case string:
		s = v
	default:
		return fmt.Errorf("cannot scan %T into StringArray", src)
	}

	// PostgreSQL array format: {val1,val2,val3}
	s = strings.TrimPrefix(s, "{")
	s = strings.TrimSuffix(s, "}")

	if s == "" {
		*a = StringArray{}
		return nil
	}

	parts := strings.Split(s, ",")
	result := make(StringArray, len(parts))
	for i, p := range parts {
		result[i] = strings.Trim(p, `"`)
	}
	*a = result
	return nil
}

func (a StringArray) Value() (driver.Value, error) {
	if a == nil || len(a) == 0 {
		return "{}", nil
	}
	escaped := make([]string, len(a))
	for i, v := range a {
		escaped[i] = `"` + strings.ReplaceAll(v, `"`, `\"`) + `"`
	}
	return "{" + strings.Join(escaped, ",") + "}", nil
}
