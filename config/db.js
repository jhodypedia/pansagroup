import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false
  }
);

export async function initDB(){
  try{
    await sequelize.authenticate();
    const { syncModels } = await import("../models/index.js");
    await syncModels();
    console.log("✅ DB connected & synced");
  }catch(e){
    console.error("DB error:", e);
    process.exit(1);
  }
}
