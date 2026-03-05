const bcrypt = require("bcrypt");
const User = require("../models/User");

async function seedDirector() {
  try {
    const directorExists = await User.findOne({ role: "Director" });

    if (directorExists) {
      console.log("Director already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("director123", 10);

    await User.create({
      name: "Mr. Orban",
      email: "director@kgl.com",
      password: hashedPassword,
      role: "Director",
      branch: "Main",
      phone: "0700000000",
      bio: "",
      profilePicture: ""
    });

    console.log("✅ Default Director created");
  } catch (error) {
    console.error("Seed error:", error);
  }
}

module.exports = seedDirector;