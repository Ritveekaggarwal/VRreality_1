import mongoose from "mongoose";

export const connectDatabase = (uri) =>
  mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 10,
  });

export const disconnectDatabase = () => mongoose.disconnect();

export const isDatabaseReady = () => mongoose.connection.readyState === 1;
