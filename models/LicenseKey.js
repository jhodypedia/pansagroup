import { DataTypes } from "sequelize";
export default (sequelize)=> sequelize.define("LicenseKey",{
  id:{ type:DataTypes.INTEGER, autoIncrement:true, primaryKey:true },
  key:{ type:DataTypes.STRING, unique:true },
  isUsed:{ type:DataTypes.BOOLEAN, defaultValue:false },
  usedByUserId:{ type:DataTypes.INTEGER, allowNull:true }
},{ tableName:"license_keys" });
