package controller

import (
	"testing"

	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestApplyPurposeGroup(t *testing.T) {
	t.Run("missing purpose when required", func(t *testing.T) {
		reqUser := &model.User{}
		cleanUser := &model.User{}
		err := ApplyPurposeGroup(reqUser, cleanUser)
		require.Error(t, err)
		assert.Equal(t, "请选择注册用途", err.Error())
	})

	t.Run("invalid purpose", func(t *testing.T) {
		reqUser := &model.User{Purpose: "xxx"}
		cleanUser := &model.User{}
		err := ApplyPurposeGroup(reqUser, cleanUser)
		require.Error(t, err)
		assert.Equal(t, "无效的注册用途", err.Error())
	})

	tests := []struct {
		purpose string
		group   string
	}{
		{purpose: "自媒体", group: "自媒体"},
		{purpose: "电商", group: "电商"},
		{purpose: "开发", group: "开发"},
	}

	for _, tt := range tests {
		t.Run(tt.purpose, func(t *testing.T) {
			reqUser := &model.User{Purpose: tt.purpose}
			cleanUser := &model.User{}
			err := ApplyPurposeGroup(reqUser, cleanUser)
			require.NoError(t, err)
			assert.Equal(t, tt.group, cleanUser.Group)
			assert.Equal(t, tt.purpose, cleanUser.GetSetting().Purpose)
		})
	}
}
