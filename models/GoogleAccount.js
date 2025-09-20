import { DataTypes } from "sequelize";
export default (sequelize)=> sequelize.define("GoogleAccount",{
  id:{ type:DataTypes.INTEGER, autoIncrement:true, primaryKey:true },
  userId:{ type:DataTypes.INTEGER },
  email:{ type:DataTypes.STRING },
  encryptedTokens:{ type:DataTypes.TEXT }
},{ tableName:"google_accounts" });
