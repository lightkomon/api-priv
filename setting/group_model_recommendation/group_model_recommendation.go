package group_model_recommendation

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/QuantumNous/new-api/setting/config"
)

const maxModelsPerGroup = 12

type GroupModelRecommendationSetting struct {
	Models map[string][]string `json:"models"`
}

var groupModelRecommendationSetting = GroupModelRecommendationSetting{
	Models: map[string][]string{},
}

func init() {
	config.GlobalConfig.Register("group_model_recommendation", &groupModelRecommendationSetting)
}

func GetSetting() *GroupModelRecommendationSetting {
	if groupModelRecommendationSetting.Models == nil {
		groupModelRecommendationSetting.Models = map[string][]string{}
	}
	return &groupModelRecommendationSetting
}

func GetRecommendedModelsForGroup(group string) []string {
	group = strings.TrimSpace(group)
	if group == "" {
		return nil
	}
	models := GetSetting().Models[group]
	if len(models) == 0 {
		return nil
	}
	result := make([]string, len(models))
	copy(result, models)
	return result
}

func Models2JSONString() string {
	bytes, err := json.Marshal(GetSetting().Models)
	if err != nil {
		return "{}"
	}
	return string(bytes)
}

func CheckGroupModelRecommendations(jsonStr string) error {
	jsonStr = strings.TrimSpace(jsonStr)
	if jsonStr == "" {
		return nil
	}
	raw := make(map[string][]string)
	if err := json.Unmarshal([]byte(jsonStr), &raw); err != nil {
		return errors.New("invalid group model recommendations JSON")
	}
	for group, models := range raw {
		group = strings.TrimSpace(group)
		if group == "" {
			return errors.New("group name cannot be empty")
		}
		if len(models) > maxModelsPerGroup {
			return errors.New("too many recommended models for group: " + group)
		}
		seen := make(map[string]struct{}, len(models))
		for _, modelName := range models {
			modelName = strings.TrimSpace(modelName)
			if modelName == "" {
				return errors.New("model name cannot be empty for group: " + group)
			}
			if _, ok := seen[modelName]; ok {
				return errors.New("duplicate model in group: " + group)
			}
			seen[modelName] = struct{}{}
		}
	}
	return nil
}
