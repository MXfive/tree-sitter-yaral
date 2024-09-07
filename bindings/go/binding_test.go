package tree_sitter_yaral_test

import (
	"testing"

	tree_sitter_yaral "github.com/mxfive/tree-sitter-yaral/bindings/go"
	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_yaral.Language())
	if language == nil {
		t.Errorf("Error loading Yaral grammar")
	}
}
