CREATE TABLE IF NOT EXISTS "person" (
    "given_name" TEXT NOT NULL DEFAULT '',
    "family_name" TEXT NOT NULL DEFAULT '',
    "year_of_birth" INTEGER NOT NULL,
    "gender" TINYINT NOT NULL,
    "party" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '',
    "source_id" TEXT NOT NULL DEFAULT '',
    "intressent_id" TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "poll" (
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source_id" TEXT PRIMARY KEY NOT NULL,
    "document_id" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "vote" (
    "vote_id" INTEGER PRIMARY KEY NOT NULL,
    "intressent_id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "answer" TINYINT NOT NULL,
    FOREIGN KEY ("intressent_id") REFERENCES "person" ("intressent_id")
      ON UPDATE CASCADE
      ON DELETE CASCADE,
    FOREIGN KEY ("poll_id") REFERENCES "poll" ("source_id")
      ON UPDATE CASCADE
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "document" (
    "doc_id" INTEGER PRIMARY KEY NOT NULL,
    "document_id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "decision_summary" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL
);