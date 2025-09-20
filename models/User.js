import { DataTypes } from "sequelize";
export default (sequelize)=> sequelize.define("User",{
  id:{ type:DataTypes.INTEGER, primaryKey:true, autoIncrement:true },
  email:{ type:DataTypes.STRING, unique:true },
  passwordHash:{ type:DataTypes.STRING },
  phone:{ type:DataTypes.STRING },           // support 08 (Indonesia)
  role:{ type:DataTypes.ENUM("user","admin"), defaultValue:"user" },
  isPremium:{ type:DataTypes.BOOLEAN, defaultValue:false },
  timezone:{ type:DataTypes.STRING, defaultValue:"Asia/Jakarta" },
  storageQuotaMB:{ type:DataTypes.INTEGER, defaultValue:2048 },
  storageUsedMB:{ type:DataTypes.FLOAT, defaultValue:0 }
},{ tableName:"users" });
