// FIXED: Use standard CommonJS require (not { default: mongoose } ES-module interop)
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["Manager", "Sales-agent", "Director"],
    // FIXED: default was "sales agent" (space, not in enum) → now valid enum value
    default: "Sales-agent",
    required: true
  },
  branch: {
    type: String,
    enum: ["Maganjo", "Matugga","Main"],
    default: "Main",
    required: true
  },
  phone: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: ""
  },
  profilePicture: {
    type: String,
    default: ""
  }
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
