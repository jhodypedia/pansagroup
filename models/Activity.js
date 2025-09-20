import { DataTypes } from "sequelize";
export default (sequelize)=> sequelize.define("Activity",{
  id:{ type:DataTypes.INTEGER, autoIncrement:true, primaryKey:true },
  userId:{ type:DataTypes.INTEGER },
  type:{ type:DataTypes.STRING }, // login, upload, live_create, etc
  meta:{ type:DataTypes.JSON }
},{ tableName:"activities" });
