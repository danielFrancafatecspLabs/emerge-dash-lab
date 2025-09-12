import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
<<<<<<< HEAD:backend/src/models/User.js
  password: { type: String, required: true },
  role: { type: String, default: "user" },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);
export default User;
=======
  role: { type: String, default: 'user' },
});

module.exports = mongoose.model('User', UserSchema);
>>>>>>> fb7190b (refactor: Remove authentication logic and update PilotosEmAndamento component styling):api/models/User.js
