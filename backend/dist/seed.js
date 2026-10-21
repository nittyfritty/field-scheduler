// Seed data from the data folder into the database for testing and development.
import fs from "node:fs";
import mongoose from "mongoose";
import Field from "./models/Fields.js";
import Calendar from "./models/Calendar.js";
import { User } from "./models/User.js";
import connectDB from "./config/db.js";
import "dotenv/config";
const fieldsData = JSON.parse(fs.readFileSync(new URL("./data/fields.json", import.meta.url), "utf-8"));
const calendarData = JSON.parse(fs.readFileSync(new URL("./data/events.json", import.meta.url), "utf-8"));
const userData = JSON.parse(fs.readFileSync(new URL("./data/users.json", import.meta.url), "utf-8"));
const fieldNames = new Set(fieldsData.map((field) => field.name));
if (fieldNames.size !== fieldsData.length) {
    throw new Error("Seed field names must be unique");
}
for (const event of calendarData) {
    if (!fieldNames.has(event.fieldName)) {
        throw new Error(`No seeded field found for "${event.fieldName}"`);
    }
}
const seedData = async () => {
    await connectDB();
    try {
        // Reset existing data before loading the seed records.
        await Field.deleteMany({});
        await Calendar.deleteMany({});
        await User.deleteMany({});
        const insertedFields = await Field.insertMany(fieldsData);
        const fieldIdsByName = new Map(insertedFields.map((field) => [field.name, field._id]));
        const eventsWithFieldIds = calendarData.map(({ fieldName, ...event }) => {
            const fieldId = fieldIdsByName.get(fieldName);
            if (!fieldId) {
                throw new Error(`No inserted field found for "${fieldName}"`);
            }
            return { ...event, fieldId };
        });
        await Calendar.insertMany(eventsWithFieldIds);
        await User.insertMany(userData);
        // Add admin user from env
        async function seedAdmin() {
            const adminEmail = process.env.ADMIN_EMAIL;
            const adminPassword = process.env.ADMIN_PASSWORD;
            if (!adminEmail || !adminPassword) {
                throw new Error("Missing required environment variables: ADMIN_EMAIL and ADMIN_PASSWORD.");
            }
            try {
                const adminExists = await User.findOne({ email: adminEmail });
                if (adminExists) {
                    console.log("Admin user already exists");
                    return;
                }
                const newAdmin = new User({
                    name: process.env.ADMIN_NAME ?? "Admin",
                    email: adminEmail,
                    password: adminPassword,
                    role: "admin",
                    isApproved: true,
                });
                await newAdmin.save();
                console.log("Admin user successfully seeded");
            }
            catch (error) {
                console.error("Error seeding admin user:", error);
                throw error;
            }
        }
        await seedAdmin();
        console.log("Data seeded successfully!");
    }
    finally {
        await mongoose.disconnect();
    }
};
seedData().catch((error) => {
    console.error("Error seeding data:", error);
    process.exitCode = 1;
});
//# sourceMappingURL=seed.js.map