package controller

import (
	"testing"

	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestResolveRecommendedModels(t *testing.T) {
	t.Run("empty configured", func(t *testing.T) {
		result := resolveRecommendedModels(nil, map[string]struct{}{"gpt-4o": {}}, nil, nil)
		assert.Nil(t, result)
	})

	t.Run("filters unavailable models and preserves order", func(t *testing.T) {
		configured := []string{"gpt-4o", "missing-model", "claude-3-5-sonnet"}
		enabledSet := map[string]struct{}{
			"gpt-4o":             {},
			"claude-3-5-sonnet": {},
		}
		pricingByName := map[string]model.Pricing{
			"gpt-4o": {
				ModelName:   "gpt-4o",
				Description: "Fast general model",
				Icon:        "OpenAI",
				VendorID:    1,
			},
			"claude-3-5-sonnet": {
				ModelName:   "claude-3-5-sonnet",
				Description: "Strong reasoning",
				Icon:        "Claude",
				VendorID:    2,
			},
		}
		vendorNames := map[int]string{
			1: "OpenAI",
			2: "Anthropic",
		}

		result := resolveRecommendedModels(configured, enabledSet, pricingByName, vendorNames)
		require.Len(t, result, 2)
		assert.Equal(t, []dto.RecommendedModel{
			{
				ModelName:   "gpt-4o",
				Description: "Fast general model",
				Icon:        "OpenAI",
				VendorName:  "OpenAI",
			},
			{
				ModelName:   "claude-3-5-sonnet",
				Description: "Strong reasoning",
				Icon:        "Claude",
				VendorName:  "Anthropic",
			},
		}, result)
	})

	t.Run("returns nil when none are enabled", func(t *testing.T) {
		result := resolveRecommendedModels(
			[]string{"gpt-4o"},
			map[string]struct{}{},
			nil,
			nil,
		)
		assert.Nil(t, result)
	})
}
