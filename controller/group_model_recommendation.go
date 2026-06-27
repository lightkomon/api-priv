package controller

import (
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	groupmodelrecommendation "github.com/QuantumNous/new-api/setting/group_model_recommendation"

	"github.com/gin-gonic/gin"
)

func resolveRecommendedModels(
	configured []string,
	enabledSet map[string]struct{},
	pricingByName map[string]model.Pricing,
	vendorNames map[int]string,
) []dto.RecommendedModel {
	if len(configured) == 0 {
		return nil
	}
	result := make([]dto.RecommendedModel, 0, len(configured))
	for _, name := range configured {
		if _, ok := enabledSet[name]; !ok {
			continue
		}
		item := dto.RecommendedModel{ModelName: name}
		if pricing, ok := pricingByName[name]; ok {
			item.Description = pricing.Description
			item.Icon = pricing.Icon
			if pricing.VendorID > 0 {
				item.VendorName = vendorNames[pricing.VendorID]
			}
		}
		result = append(result, item)
	}
	if len(result) == 0 {
		return nil
	}
	return result
}

func GetUserRecommendedModels(c *gin.Context) {
	userId := c.GetInt("id")
	user, err := model.GetUserCache(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	configured := groupmodelrecommendation.GetRecommendedModelsForGroup(user.Group)
	enabledModels := model.GetGroupEnabledModels(user.Group)
	enabledSet := make(map[string]struct{}, len(enabledModels))
	for _, modelName := range enabledModels {
		enabledSet[modelName] = struct{}{}
	}

	pricingByName := make(map[string]model.Pricing, len(configured))
	for _, pricing := range model.GetPricing() {
		pricingByName[pricing.ModelName] = pricing
	}
	vendorNames := make(map[int]string)
	for _, vendor := range model.GetVendors() {
		vendorNames[vendor.ID] = vendor.Name
	}

	models := resolveRecommendedModels(configured, enabledSet, pricingByName, vendorNames)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    models,
	})
}
