const OLD_DEFAULT_PIC =
  process.env.OLD_DEFAULT_PIC ||
  "https://ik.imagekit.io/sanujii/default-profile.png";
const NEW_DEFAULT_PIC =
  process.env.DEFAULT_AVATAR ||
  "https://www.gravatar.com/avatar/?d=mp&f=y&s=200";

/**
 * Serialize user data for API responses
 * Handles profile picture migration from old to new default
 * @param {Object} user - User document from database
 * @returns {Object} Serialized user object
 */
const serializeUser = (user) => {
  const obj = user.toObject ? user.toObject() : user;

  // Replace old default pic with new one
  if (obj.profilePic === OLD_DEFAULT_PIC) {
    obj.profilePic = NEW_DEFAULT_PIC;
  }

  return obj;
};

module.exports = { serializeUser };
