-- AlterTable
ALTER TABLE "DriveStudent" ADD COLUMN     "atsScore" INTEGER,
ADD COLUMN     "atsStatus" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN     "educationMatch" TEXT,
ADD COLUMN     "experienceMatch" TEXT,
ADD COLUMN     "keywordMatch" INTEGER,
ADD COLUMN     "matchingKeywords" TEXT[],
ADD COLUMN     "matchingSkills" TEXT[],
ADD COLUMN     "missingKeywords" TEXT[],
ADD COLUMN     "missingSkills" TEXT[],
ADD COLUMN     "recommendations" TEXT[],
ADD COLUMN     "requirementMatch" INTEGER,
ADD COLUMN     "resumeStrength" INTEGER,
ADD COLUMN     "skillsMatch" INTEGER;

-- AlterTable
ALTER TABLE "PlacementDrive" ADD COLUMN     "jdExtracted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jdExtractedInfo" JSONB,
ADD COLUMN     "jdFileName" TEXT,
ADD COLUMN     "jdFileSize" INTEGER,
ADD COLUMN     "jdFileUrl" TEXT,
ADD COLUMN     "jdText" TEXT;
