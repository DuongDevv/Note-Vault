# 2. Secure Masked Blocks, Credential Field Components, and Auto-Clear Clipboard Architecture

Date: 2026-09-29

## Status

Accepted

## Context

Developers and technical knowledge workers frequently store operational secrets—such as API keys, environment variables, database connection strings, webhook secrets, and account tokens—within their documentation and engineering notes.

While entire notes can be locked behind a Master PIN (`is_locked: true`), once a note is decrypted, sensitive tokens are rendered as raw plaintext on the document canvas. This introduces several vulnerabilities:

1. **Shoulder Surfing & Screen-Share Leaks**: Working in shared workspaces or during video calls exposes sensitive tokens directly to onlookers and screen recordings.
2. **Copy Friction & Accidental Mutation**: Selecting lengthy cryptographic tokens manually with a cursor is prone to missing characters or accidentally modifying the secret value.
3. **Clipboard Persistence**: Plaintext secrets copied to the system clipboard remain indefinitely in OS clipboard history managers (Raycast, Alfred, Windows Clipboard History).
4. **Unstructured Credential Layouts**: Users format credentials using ad-hoc bullet points or code blocks without clear field semantics (Label, Environment, Key, Value).

## Decision

Implement a custom Tiptap Node extension (`SecretBlock`) rendered via React NodeView with masked state by default and an ephemeral auto-clearing clipboard utility:

1. **Structured ProseMirror Node**: Model credentials as native document nodes containing structured attributes (`label`, `value`, `environment`, `service`).
2. **Masked State by Default**: Render tokens with bullet mask dots (`••••••••••••••••••••`) in DOM presentation until explicitly revealed by the user.
3. **Frictionless Copy**: Provide single-click clipboard copy without requiring the user to unmask or highlight the secret token on screen.
4. **Ephemeral Clipboard**: Automatically overwrite and purge the copied secret from the system clipboard after a deterministic 30-second window.

## Consequences

- Zero shoulder-surfing exposure during screen sharing and public workspace operation.
- Seamless developer workflow with one-click secret copying.
- Automatic mitigation against clipboard history persistence attacks.
- Clean document AST representation compatible with default AES-256-GCM encryption at rest without database schema modifications.

### Explicit Tradeoffs

- **Component NodeView Overhead vs Pure Markdown Simplicity**: Accept React NodeView DOM rendering overhead in exchange for interactive mask toggling and one-click copy buttons.
- **Client Heap Exposure vs Usability**: Decrypted secret values exist in client memory while the document is active; full purging requires locking the note or unmounting the canvas.
- **Ephemeral Timer Reliability vs OS Permissions**: Automatic clipboard clearing depends on the browser Clipboard API permissions and page focus lifecycle; best-effort clearance is accepted when background tabs lose permission.
