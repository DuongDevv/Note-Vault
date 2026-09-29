# 3. Enveloped Encryption Architecture and Master PIN Key Rotation

Date: 2026-09-30

## Status

Accepted

## Context

Under NoteVault's initial encryption design, PIN-locked notes were encrypted directly using a symmetric key derived from the user's Master PIN (`vaultKey`).

When a user updates their Master PIN, this direct encryption approach introduces critical operational and architectural hazards:

1. **Catastrophic Key Drift**: Changing the user's PIN hash in the database without re-encrypting existing locked notes renders every previously locked note permanently unrecoverable.
2. **Computational Bottleneck**: Re-encrypting entire document bodies directly requires loading, decrypting, and re-encrypting large payloads across all locked notes, causing Node.js event-loop CPU spikes and HTTP 504 Gateway Timeouts.
3. **Partial Mutation Risk**: Any failure or network disconnect mid-process leaves a fraction of notes locked with the old PIN and the remainder with the new PIN, compromising data integrity.

## Decision

Adopt the **Enveloped Encryption (Key Encapsulation / KEK)** model for all PIN-protected notes and execute Master PIN rotation inside an atomic database transaction:

1. **Two-Tier Key Hierarchy**:
   - **Data Encryption Key (DEK)**: A unique, cryptographically random 256-bit key (`dataKey`) generated for each note, used exclusively to encrypt and decrypt the note's document content.
   - **Key Encryption Key (KEK)**: The user's Master PIN derived key (`vaultKey`), used strictly to encapsulate and protect the note's `dataKey`.
2. **Encapsulated Storage**:
   - The encrypted document body remains stored in `notes.content`.
   - The encapsulated DEK is stored in a dedicated `encrypted_key` column on the `notes` table.
3. **Atomic Key Rotation**:
   - Master PIN rotation requires verifying the user's current PIN before applying the new PIN.
   - During PIN change, document contents (`notes.content`) are untouched. The server un-encapsulates each 32-byte `dataKey` with the old `vaultKey`, encapsulates it with the new `vaultKey`, and updates `encrypted_key` in a single ACID transaction alongside the updated `private_pin_hash`.
4. **Session Lock State**:
   - Completing a Master PIN rotation immediately invalidates active client unlock sessions, requiring re-authentication under the new PIN.

## Consequences

- Key rotation performance scales with note count rather than note content size, completing in milliseconds regardless of document length.
- Document bodies are never loaded or rewritten during PIN rotation, eliminating timeout risks and memory pressure.
- Database transaction atomicity guarantees that either all note keys rotate successfully or the entire rotation rolls back to the prior PIN state.
- Zero-Knowledge posture is preserved: the database never stores plaintext PINs, DEKs, or KEKs.

### Explicit Tradeoffs

- **Schema Addition vs Direct Encryption Simplicity**: Accept adding an `encrypted_key` column to the `notes` model in exchange for sub-second key rotation and zero payload rewrite overhead.
- **Two-Step Decryption Overhead vs Direct Decryption**: Reading a locked note requires decrypting the DEK first, then decrypting the body, adding negligible microsecond cryptographic overhead.
- **Backward Compatibility Grace Period vs Clean Cutover**: Existing locked notes lacking an `encrypted_key` require a transparent on-the-fly migration to enveloped format upon their first unlock.
