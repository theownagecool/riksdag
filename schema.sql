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
    "document_id" TEXT PRIMARY KEY NOT NULL,
    "poll_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    FOREIGN KEY ("document_id") REFERENCES "poll" ("document_id")
      ON UPDATE CASCADE
      ON DELETE CASCADE
);