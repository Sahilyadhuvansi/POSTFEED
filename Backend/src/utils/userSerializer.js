const OLD_DEFAULT_PIC =
  process.env.OLD_DEFAULT_PIC ||
  "https://ik.imagekit.io/sanujii/default-profile.png";
const NEW_DEFAULT_PIC =
  process.env.DEFAULT_AVATAR ||
  "https://www.gravatar.com/avatar/?d=mp&f=y&s=200";

const serializeUser = (user) => {
  const obj = user.toObject ? user.toObject() : user;

  if (obj.profilePic === OLD_DEFAULT_PIC) {
    obj.profilePic = NEW_DEFAULT_PIC;
  }

  delete obj.password;
  delete obj.__v;

  return obj;
};

module.exports = { serializeUser };
