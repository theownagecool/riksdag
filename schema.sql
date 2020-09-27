CREATE TABLE "person" (
    "person_id" INTEGER PRIMARY KEY NOT NULL,
    "given_name" TEXT NOT NULL DEFAULT '',
    "family_name" TEXT NOT NULL DEFAULT '',
    "year_of_birth" INTEGER NOT NULL,
    "gender" TINYINT NOT NULL,
    "party" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '',
    "source_id" TEXT NOT NULL DEFAULT ''
);

CREATE TABLE "poll" (
    "poll_id" INTEGER PRIMARY KEY NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source_id" TEXT NOT NULL
);

CREATE TABLE "vote" (
    "vote_id" INTEGER PRIMARY KEY NOT NULL,
    "person_id" INTEGER NOT NULL,
    "poll_id" INTEGER NOT NULL,
    "answer" TINYINT NOT NULL,
    FOREIGN KEY ("person_id") REFERENCES "person" ("person_id")
      ON UPDATE CASCADE
      ON DELETE CASCADE,
    FOREIGN KEY ("poll_id") REFERENCES "poll" ("poll_id")
      ON UPDATE CASCADE
      ON DELETE CASCADE
);
