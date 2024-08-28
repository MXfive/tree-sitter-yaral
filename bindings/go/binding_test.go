package tree_sitter_yaral_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_yaral "github.com/tree-sitter/tree-sitter-yaral/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_yaral.Language())
	if language == nil {
		t.Errorf("Error loading Yaral grammar")
	}
}
