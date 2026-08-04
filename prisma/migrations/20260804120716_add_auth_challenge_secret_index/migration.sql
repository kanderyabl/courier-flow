-- CreateIndex
CREATE INDEX "auth_challenges_type_secret_hash_idx" ON "auth_challenges"("type", "secret_hash");
