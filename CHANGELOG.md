# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Fixed

- `setAttribute` not updating element properties correctly.

## 0.0.4 - 2024-01-07

### Added

- add `Tag` type.

## 0.0.3 - 2023-12-28

### Fixed

- `changeNodePosition` checks if the element to be replaced is the same as the one being moved before changing its position.

## 0.0.2 - 2023-12-16

### Fixed

- `setEventListener` : remove any existing event with the same `key` before adding a new one

## 0.0.1 - 2023-12-14

### Added

- initial library prototype
- `element` : create DOM element.
- `text` : create text node.
- `setEventListener` : add an event listener to an element.
- `removeEventListener` : remove an event listener from an element.
- `setAttribute` : add an attribute an element.
- `removeAttribute` : remove an attribute from an element.
- `insertNode` : insert a node in an element.
- `removeNode` : remove a node.
- `changeNodePosition` : change node position.
- `setText` : update text node content.
