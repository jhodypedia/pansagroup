import { sequelize } from "../config/db.js";
import UserModel from "./User.js";
import LicenseKeyModel from "./LicenseKey.js";
import GoogleAccountModel from "./GoogleAccount.js";
import VideoModel from "./Video.js";
import LiveEventModel from "./LiveEvent.js";
import SettingModel from "./Setting.js";
import ActivityModel from "./Activity.js";

export const User = UserModel(sequelize);
export const LicenseKey = LicenseKeyModel(sequelize);
export const GoogleAccount = GoogleAccountModel(sequelize);
export const Video = VideoModel(sequelize);
export const LiveEvent = LiveEventModel(sequelize);
export const Setting = SettingModel(sequelize);
export const Activity = ActivityModel(sequelize);

// Associations
User.hasMany(GoogleAccount,{ foreignKey:"userId" });
GoogleAccount.belongsTo(User,{ foreignKey:"userId" });

User.hasMany(Video,{ foreignKey:"userId" });
Video.belongsTo(User,{ foreignKey:"userId" });
GoogleAccount.hasMany(Video,{ foreignKey:"googleAccountId" });
Video.belongsTo(GoogleAccount,{ foreignKey:"googleAccountId" });

User.hasMany(LiveEvent,{ foreignKey:"userId" });
LiveEvent.belongsTo(User,{ foreignKey:"userId" });
GoogleAccount.hasMany(LiveEvent,{ foreignKey:"googleAccountId" });
LiveEvent.belongsTo(GoogleAccount,{ foreignKey:"googleAccountId" });

export async function syncModels(){
  await sequelize.sync();
}
