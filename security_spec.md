# Firestore Security Specification

This document defines the data parameters, security invariants, and a test suite specification for checking the integrity of our Firebase Firestore layers.

## 1. Data Invariants

- **Ownership Locking**: All database nodes (`folders`, `notes`, `pdf_annotations`) must contain a `user_id` field. Reads and writes are permitted only if `request.auth.uid` matches the existing or incoming `user_id` field.
- **Strict Fields**: During creation, document structures are parsed strictly to prevent shadow attributes. During updates, only whitelisted mutable properties can be modified.
- **Size Bounds**: String/content fields must be restricted in size (e.g. title lengths, content lengths) to prevent Denial of Wallet memory/payload exhaustion.

## 2. The "Dirty Dozen" Payloads (Mock Penetration)

1. **Spoofed User ID Note Creation**: Writing a note to `notes/note_1` with `user_id` set to standard victim ID while authenticated as hacker.
2. **Global Notes Reading**: Attempting a collection group count query on `/notes` sans `user_id` filtering.
3. **Ghost Attribute Injection on Note Creation**: Creating a notes node containing a hidden privilege field `isAdmin: true`.
4. **Altering Immutable Creator UID**: Modifying a folder's `user_id` to transfer ownership from user A to user B.
5. **Junk Character Path Injection**: Writing to path with 1.5KB invalid character set ID.
6. **Negative Page Number PDF Annotation**: Writing page number `-5` to `pdf_annotations/anno_1`.
7. **Gigantic Text Content Upload**: Squeezing a 15MB base64 content payload into a note text model.
8. **Invalid Note Type Selection**: Creating a note of type `video` or `exe`.
9. **Unauthenticated Read Request**: Trying to pull documents folder items when not logged in.
10. **Note Deletion of Another User**: Triggering `delete` action on folder belonging to someone else.
11. **Spoofing Timestamp Attribute**: Setting a post-dated futuristic `created_at` timestamp.
12. **Malicious Annotation Object Injection**: Passing an array containing dangerous shell chars instead of clean comments list.

## 3. Rules Evaluation & Enforcement

For details regarding live compilation, ESLint validator execution is run using `npm run lint`.
