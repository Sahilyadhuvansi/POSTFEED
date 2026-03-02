const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const NEW_DEFAULT_PIC =
  process.env.DEFAULT_AVATAR ||
  "https://www.gravatar.com/avatar/?d=mp&f=y&s=200";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    profilePic: {
      type: String,
      default: NEW_DEFAULT_PIC,
    },
    bio: {
      type: String,
      default: "",
      maxlength: [160, "Bio cannot be longer than 160 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        // Remove sensitive/internal fields
        delete ret.password;
        delete ret.__v;

        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        // Remove sensitive/internal fields
        delete ret.password;
        delete ret.__v;

        return ret;
      },
    },
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("user", userSchema);
