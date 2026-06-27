package dto

type RecommendedModel struct {
	ModelName   string `json:"model_name"`
	Description string `json:"description,omitempty"`
	Icon        string `json:"icon,omitempty"`
	VendorName  string `json:"vendor_name,omitempty"`
}
