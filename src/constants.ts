
export const GRADES = [
    {
        grade:1,
    },
    {
        grade:2,
    },
    {
        grade:3,
    },
    {
        grade:4,
    },
    {
        grade:5,
    },
    {
        grade:6,
    },
    {
        grade:7,
    },
    {
        grade:8,
    },
    {
        grade:9,
    },
    {
        grade:10,
    },
    {
        grade:11,
    },
    {
        grade:12,
    }
]

/*

model User {
  id                String             @id @default(uuid())
  email             String             @unique
  name              String?
  password          String
  role              Role               @default(STUDENT)
  createdAt         DateTime           @default(now())
  avatar            Avatar             @default(MALE)
  grade             Grade              @relation(fields: [gradeId], references: [id])
  gradeId           String
  QuestionResponses QuestionResponse[]
}
*/