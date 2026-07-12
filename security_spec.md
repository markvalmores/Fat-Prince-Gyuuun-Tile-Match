# Security Specification

## 1. Data Invariants
- **Leaderboard Entries**:
  - `name` must be a string of length >= 1 and <= 20.
  - `score` must be an integer >= 0.
  - `level` must be an integer >= 1.
  - `timestamp` must be the server time (`request.time`).
- **User Missions**:
  - `playerId` must be an alphanumeric/dashed/underscored string <= 128 characters.
  - `playerName` must be a string of length <= 20.
  - `date` must be a string of exactly 10 characters (matching the YYYY-MM-DD pattern).
  - `clearedCakes` and `clearedSwords` must be integers >= 0.
  - `winStreak` must be an integer >= 0.
  - `claimedCakes`, `claimedSwords`, and `claimedWinStreak` must be boolean fields.
  - `updatedAt` must be the server time (`request.time`).

## 2. The "Dirty Dozen" Payloads (Designed to Fail)
Below are 12 malicious or invalid payloads that our security rules will block (returning `PERMISSION_DENIED`):

### Leaderboard Collection Attacks
1. **Name Overflow**: `{ "name": "A_very_very_long_knight_name_exceeding_twenty_characters", "score": 100, "level": 1, "timestamp": "request.time" }`
2. **Negative Score**: `{ "name": "Gyuuun", "score": -50, "level": 1, "timestamp": "request.time" }`
3. **Invalid Level**: `{ "name": "Gyuuun", "score": 2500, "level": 0, "timestamp": "request.time" }`
4. **Incorrect Timestamp (Client-provided)**: `{ "name": "Gyuuun", "score": 500, "level": 2, "timestamp": "2020-01-01T00:00:00Z" }`
5. **Shadow Field Injection**: `{ "name": "Gyuuun", "score": 200, "level": 2, "isVerifiedAdmin": true, "timestamp": "request.time" }`
6. **Malicious Empty Name**: `{ "name": "", "score": 120, "level": 1, "timestamp": "request.time" }`

### UserMissions Collection Attacks
7. **Giant ID Poisoning**: Trying to write to a document ID of 10KB length (will be rejected by path length bounds).
8. **Malicious Progress Value**: `{ "playerId": "usr123", "playerName": "Sir Gyuuun", "date": "2026-07-11", "clearedCakes": -10, "clearedSwords": 5, "winStreak": 0, "claimedCakes": false, "claimedSwords": false, "claimedWinStreak": false, "updatedAt": "request.time" }` (Negative Cake count)
9. **Invalid Type for Claimed Flags**: `{ "playerId": "usr123", "playerName": "Sir Gyuuun", "date": "2026-07-11", "clearedCakes": 10, "clearedSwords": 5, "winStreak": 0, "claimedCakes": "yes", "claimedSwords": false, "claimedWinStreak": false, "updatedAt": "request.time" }` (String instead of boolean)
10. **Date Format Poisoning**: `{ "playerId": "usr123", "playerName": "Sir Gyuuun", "date": "2026-07-11-extra-junk", "clearedCakes": 10, "clearedSwords": 5, "winStreak": 0, "claimedCakes": false, "claimedSwords": false, "claimedWinStreak": false, "updatedAt": "request.time" }` (Invalid date length/format)
11. **Shadow State Shortcut**: `{ "playerId": "usr123", "playerName": "Sir Gyuuun", "date": "2026-07-11", "clearedCakes": 50, "clearedSwords": 5, "winStreak": 0, "claimedCakes": true, "claimedSwords": false, "claimedWinStreak": false, "updatedAt": "request.time", "superAdminOverride": true }` (Injecting extra attributes)
12. **Device Spoofing**: `{ "playerId": "another_player_id", "playerName": "Sir Gyuuun", "date": "2026-07-11", "clearedCakes": 50, "clearedSwords": 5, "winStreak": 0, "claimedCakes": false, "claimedSwords": false, "claimedWinStreak": false, "updatedAt": "request.time" }` (Attempting to modify another player's record without matching the ID).

## 3. Test Runner Design
Our rules will enforce matching the document path with the player ID for the `/userMissions/{missionId}` collection, ensuring each player can only write to their own document (where `missionId` contains their `playerId`).
