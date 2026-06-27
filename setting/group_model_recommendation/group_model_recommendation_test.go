package group_model_recommendation

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCheckGroupModelRecommendations(t *testing.T) {
	t.Run("valid payload", func(t *testing.T) {
		err := CheckGroupModelRecommendations(`{"自媒体":["gpt-4o","claude-3-5-sonnet"],"开发":["gpt-4o-mini"]}`)
		require.NoError(t, err)
	})

	t.Run("invalid json", func(t *testing.T) {
		err := CheckGroupModelRecommendations("{")
		require.Error(t, err)
	})

	t.Run("empty group", func(t *testing.T) {
		err := CheckGroupModelRecommendations(`{"":["gpt-4o"]}`)
		require.Error(t, err)
	})

	t.Run("empty model", func(t *testing.T) {
		err := CheckGroupModelRecommendations(`{"自媒体":[""]}`)
		require.Error(t, err)
	})

	t.Run("duplicate model", func(t *testing.T) {
		err := CheckGroupModelRecommendations(`{"自媒体":["gpt-4o","gpt-4o"]}`)
		require.Error(t, err)
	})

	t.Run("too many models", func(t *testing.T) {
		models := make([]string, maxModelsPerGroup+1)
		for i := range models {
			models[i] = "model-" + strings.TrimSpace(string(rune('a'+i)))
		}
		payloadBytes, err := json.Marshal(map[string][]string{"自媒体": models})
		require.NoError(t, err)
		err = CheckGroupModelRecommendations(string(payloadBytes))
		require.Error(t, err)
	})
}

func TestGetRecommendedModelsForGroup(t *testing.T) {
	groupModelRecommendationSetting.Models = map[string][]string{
		"自媒体": {"gpt-4o", "claude-3-5-sonnet"},
	}
	assert.Equal(t, []string{"gpt-4o", "claude-3-5-sonnet"}, GetRecommendedModelsForGroup("自媒体"))
	assert.Nil(t, GetRecommendedModelsForGroup("missing"))
}
