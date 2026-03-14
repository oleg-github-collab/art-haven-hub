package validate

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/go-playground/validator/v10"
)

var v = validator.New(validator.WithRequiredStructEnabled())

func Struct(s interface{}) error {
	if err := v.Struct(s); err != nil {
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			details := make(map[string]interface{})
			for _, e := range validationErrors {
				details[e.Field()] = fmt.Sprintf("failed on '%s' validation", e.Tag())
			}
			return apperror.ValidationWithDetails("validation failed", details)
		}
		return apperror.Validation(err.Error())
	}
	return nil
}

func DecodeJSON(r *http.Request, dst interface{}) error {
	if r.Body == nil {
		return apperror.BadRequest("request body is empty")
	}

	decoder := json.NewDecoder(io.LimitReader(r.Body, 1<<20)) // 1MB limit

	if err := decoder.Decode(dst); err != nil {
		return apperror.BadRequest(fmt.Sprintf("invalid JSON: %s", err.Error()))
	}

	return nil
}

func DecodeAndValidate(r *http.Request, dst interface{}) error {
	if err := DecodeJSON(r, dst); err != nil {
		return err
	}
	return Struct(dst)
}
