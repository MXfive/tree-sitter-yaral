import XCTest
import SwiftTreeSitter
import TreeSitterYaral

final class TreeSitterYaralTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_yaral())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Yaral grammar")
    }
}
