import bcrypt from "bcrypt";
import { prisma } from "..";

async function createAdminUser(
  email: string,
  password: string,
  name: string,
  avatar: "MALE" | "FEMALE"
) {
  try {
    // hash the plain text password and create a user with role ==="ADMIN"
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existingUser) {
      throw new Error("User with email already exists");
    }

    const adminUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        avatar: avatar,
        name: name.trim(),
        role: "ADMIN",
      },
    });

    console.log("Admin user created :- ", adminUser.email, " ", adminUser.name);
  } catch (error) {
    console.log(error);
  }
}

createAdminUser(process.argv[2], process.argv[3], process.argv[4], "MALE")
  .then(() => {
    console.log("SUCCESSFULLY ADDED ADMIN USER");
  })
  .catch((e) => console.log("FAILED TO CREATE ADMIN USER"));
