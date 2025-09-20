import { DataTypes } from "sequelize";
export default (sequelize)=> sequelize.define("Video",{
  id:{ type:DataTypes.INTEGER, autoIncrement:true, primaryKey:true },
  userId:{ type:DataTypes.INTEGER },
  googleAccountId:{ type:DataTypes.INTEGER, allowNull:true },
  title:{ type:DataTypes.STRING },
  description:{ type:DataTypes.TEXT },
  categoryId:{ type:DataTypes.STRING, allowNull:true },
  privacyStatus:{ type:DataTypes.STRING, defaultValue:"private" },
  filePath:{ type:DataTypes.STRING, allowNull:true },
  thumbPath:{ type:DataTypes.STRING, allowNull:true },
  sizeMB:{ type:DataTypes.FLOAT, defaultValue:0 },
  scheduleAt:{ type:DataTypes.DATE, allowNull:true },
  youtubeVideoId:{ type:DataTypes.STRING, allowNull:true },
  status:{ type:DataTypes.ENUM("pending","scheduled","uploading","uploaded","failed"), defaultValue:"pending" }
},{ tableName:"videos" });
