import { DataTypes } from "sequelize";
export default (sequelize)=> sequelize.define("LiveEvent",{
  id:{ type:DataTypes.INTEGER, autoIncrement:true, primaryKey:true },
  userId:{ type:DataTypes.INTEGER },
  googleAccountId:{ type:DataTypes.INTEGER },
  title:{ type:DataTypes.STRING },
  description:{ type:DataTypes.TEXT },
  scheduledStartTime:{ type:DataTypes.DATE },
  broadcastId:{ type:DataTypes.STRING, allowNull:true },
  streamId:{ type:DataTypes.STRING, allowNull:true },
  streamKey:{ type:DataTypes.STRING },
  ingestionUrl:{ type:DataTypes.STRING },
  status:{ type:DataTypes.ENUM("scheduled","ready","live","complete","failed"), defaultValue:"scheduled" }
},{ tableName:"live_events" });
