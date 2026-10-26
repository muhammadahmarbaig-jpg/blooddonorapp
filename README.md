# Blood Bridge - Backend API

## Setup

1. `npm install`
2. Create a MySQL database matching `DB_NAME` in your `.env`.
3. Copy `.env.example` to `.env`, fill in your real values.
4. `npm run dev`
5. `npm run create-admin` (one-time)

## Account types

| Value | Meaning |
|-------|---------|
| 1     | Donor   |
| 2     | Society |
| 3     | Admin   |
| 4     | Rider (new) |

## Rider / Pick-and-Drop feature (new)

New table: `ride_requests` (`pickupAddress`, `dropAddress`, `city`,
`requestedTime`, `status`, `notes`, `donorId`, `riderId`).

Status lifecycle: `pending` -> `accepted` -> `in_progress` -> `completed`
(or `cancelled` at any point before completion).

| Method | Path                  | Auth required | Notes |
|--------|-----------------------|----------------|-------|
| POST   | /api/signup/rider       | No             | New signup type; requires phone number, admin approval like donors/societies |
| POST   | /api/rides               | Yes (donor)    | Request a pickup - creates a `pending` ride |
| GET    | /api/rides                | Yes            | Donor: their own rides. Rider: pending rides in their city + their accepted rides |
| POST   | /api/rides/:id/accept       | Yes (rider)    | Claims a pending ride - only works if still `pending` |
| PUT    | /api/rides/:id                | Yes            | Rider updates to `in_progress`/`completed`/`cancelled`; donor can only `cancelled` their own |

Riders are matched to donors by **city**, not GPS distance - this matches
how the rest of the app (donor search, blood requests) already works, and
avoids needing a full mapping/geolocation integration.

Also added: `phoneNumber` and `vehicleInfo` columns on `users` (both
nullable, used by donors and riders respectively). Admin's pending/all
account lists now include rider signups too, since riders need the same
approval gate as donors and societies.

Requires a database reset (new table + new columns) if coming from an
older copy.

## Emergency Request System (expanded)

Emergency requests now have a full lifecycle instead of just a broadcast flag:

New table: `emergency_responses` (`bloodRequestId`, `donorId`) - tracks which
donors clicked "I Can Help" on a given emergency request.

New column on `blood_requests`: `isFulfilled` (boolean, defaults to false).
Once true, that request stops appearing in any donor's home page alerts.

| Method | Path                        | Auth required | Notes |
|--------|-----------------------------|----------------|-------|
| POST   | /api/requests/:id/respond     | Yes (donor)    | Records this donor as willing to help; rejects a second response from the same donor with `409` |
| POST   | /api/requests/:id/fulfill      | Yes (society, own request only) | Marks the request fulfilled - stops broadcasting it |
| GET    | /api/requests/:id/responders      | Yes (society, own request only) | Lists every donor who responded, with contact info (email, phone, blood group) |

`GET /home` for donors now filters emergency alerts to `isFulfilled: false`
only, so resolved emergencies naturally disappear from every donor's
dashboard without needing any cleanup job.

Requires a database reset (new table + new column) if coming from an older
copy.
