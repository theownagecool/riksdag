CREATE TABLE "person" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "given_name" TEXT NOT NULL DEFAULT '',
    "family_name" TEXT NOT NULL DEFAULT '',
    "gender" TINYINT NOT NULL,
    "party" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '',
    "source_id" TEXT NOT NULL DEFAULT ''
);
