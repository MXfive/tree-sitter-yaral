package tree_sitter_yaral_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/MXfive/tree-sitter-yaral"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_yaral.Language())
	if language == nil {
		t.Errorf("Error loading Yaral grammar")
	}
}
