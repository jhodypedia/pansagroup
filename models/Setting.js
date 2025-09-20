import { DataTypes } from "sequelize";
export default (sequelize)=> sequelize.define("Setting",{
  id:{ type:DataTypes.INTEGER, primaryKey:true },
  recaptchaEnabled:{ type:DataTypes.BOOLEAN, defaultValue:false },
  recaptchaSiteKey:{ type:DataTypes.STRING },
  recaptchaSecret:{ type:DataTypes.STRING },
  qrisPayload:{ type:DataTypes.TEXT },
  qrisImagePath:{ type:DataTypes.STRING }
},{ tableName:"settings" });
