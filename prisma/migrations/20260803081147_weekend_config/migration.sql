-- CreateTable
CREATE TABLE "WeekendConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "anchorOffSaturday" DATE NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeekendConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeekendException" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isOff" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeekendException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeekendException_date_key" ON "WeekendException"("date");
