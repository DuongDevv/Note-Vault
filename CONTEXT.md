# NoteVault: Enterprise Personal Knowledge & Encrypted Vault

NoteVault is a personal knowledge management, structured markdown note-taking, and encrypted vault platform.

## Core Knowledge & Organization

**Note**:
The primary content unit containing a title, structured ProseMirror JSON AST content (encrypted at rest by default using AES-256-GCM), categorization tags, creation timestamp, and metadata.
_Avoid_: Document, File, Item, Entry, Record

**Topic**:
A primary categorical folder under which notes are organized (e.g. Học tập, Công việc, Ý tưởng).
_Avoid_: Category, Directory, Tag, Group, Label

**Tag**:
A granular, hashtag-formatted descriptor prefixed with `#` (e.g. `#PhátTriển`, `#AI`, `#ThuậtToán`) attached to individual notes.
_Avoid_: Category, Meta, Keyword

**Filter Pills**:
A horizontally scrollable pill/chip control on mobile and desktop allowing instant filtering of notes by topic or viewing "Tất cả" (all notes).
_Avoid_: Tabs, Category Buttons, Horizontal List

## Security & Vault Isolation

**Vault**:
The encrypted storage partition within NoteVault designed for sensitive records requiring cryptographic protection.
_Avoid_: Safe, Locker, Secret Box, Stash

**Private Note**:
A high-security note whose encrypted payload requires private session Master PIN authentication to unlock.
_Avoid_: Secret Note, Hidden Note, Protected Item
**Master PIN**:
A 4-to-6 digit secret code hashed with Argon2id used to unlock private vault access and generate temporary Redis-backed session tokens.
_Avoid_: Password, Passcode, Key, Vault Code

**Encrypted Payload**:
A structured JSON object storing AES-256-GCM encrypted ciphertext, a 16-byte initialization vector (`iv`), and a 16-byte authentication tag (`authTag`).
_Avoid_: Hash, Secret Blob, Encrypted String

## Presentation & Analytics

**Metric Strip**:
A responsive dashboard analytic strip summarizing key personal productivity indicators: total note count, encrypted note count, active topics, and recommended review schedule.
_Avoid_: Stats Bar, Analytics Row, Summary Cards

**View Mode**:
The visualization layout of the note collection, supporting either a responsive multi-column card `grid` or a compact row-based `list`.
_Avoid_: Layout Style, Display Mode, View Type

**Recent Searches**:
A locally persisted dropdown history of search keywords, allowing instant re-execution and individual item deletion.
_Avoid_: History, Search Log, Past Queries
