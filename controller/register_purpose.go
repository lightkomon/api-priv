package controller

import (
	"errors"
	"strings"

	"github.com/QuantumNous/new-api/model"
)

// PurposeGroupMap maps registration purpose identifiers to user group names.
var PurposeGroupMap = map[string]string{
	"自媒体": "自媒体",
	"电商":  "电商",
	"开发":  "开发",
}

const RegisterPurposeRequired = true

// ApplyPurposeGroup validates the registration purpose and assigns the user group.
// Call before cleanUser.Insert().
func ApplyPurposeGroup(reqUser *model.User, cleanUser *model.User) error {
	purpose := strings.TrimSpace(reqUser.Purpose)
	if purpose == "" {
		if RegisterPurposeRequired {
			return errors.New("请选择注册用途")
		}
		return nil
	}
	group, ok := PurposeGroupMap[purpose]
	if !ok {
		return errors.New("无效的注册用途")
	}
	cleanUser.Group = group
	setting := cleanUser.GetSetting()
	setting.Purpose = purpose
	cleanUser.SetSetting(setting)
	return nil
}
